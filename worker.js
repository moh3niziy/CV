// API سایت نوبت‌دهی روی Cloudflare Workers با دیتابیس D1.
// فایل‌های سایت (پوشهٔ public) را خود Cloudflare سرو می‌کند و فقط مسیرهای /api به این کد می‌رسند.
//
// نقش‌ها:
//   super  — مدیر سایت (Secretهای ADMIN_USERNAME و ADMIN_PASSWORD): ساخت، غیرفعال‌سازی و حذف آرایشگاه و تعیین مالک
//   owner  — مالک آرایشگاه: مدیریت آرایشگرها، اطلاعات آرایشگاه و همهٔ نوبت‌ها
//   barber — آرایشگر: فقط نوبت‌های خودش
//
// داده‌های هر آرایشگاه (آرایشگرها و نوبت‌ها) یک سند JSON در جدول shops است و ستون version
// جلوی بازنویسی هم‌زمان را می‌گیرد. حساب‌های کاربری در جدول accounts با رمز هش‌شده نگهداری می‌شوند.

const EMPTY = { barbers: [], appointments: [] };
const MAX_BODY = 1024 * 1024;
const TOKEN_DAYS = 30;
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;
const TIME_ZONE = 'Asia/Tehran'; // ساعت مرجع برای جلوگیری از رزرو در زمان گذشته
const PAST_GRACE_MIN = 5;        // چند دقیقه تأخیر مجاز (مثلاً ثبت مشتری که همین الان نشسته)

// اشتراک: هر آرایشگاه جدید ۳۰ روز رایگان دارد. ۷ روز آخر هشدار، بعد از پایان ۷ روز «فقط مشاهده»
// و پس از آن دقیقاً مثل غیرفعال‌سازی دستی رفتار می‌شود.
const FREE_DAYS = 30;
const WARN_DAYS = 7;
const GRACE_DAYS = 7;
const SUPPORT = { phone: '09399515814', telegram: 'moh3nIziy' }; // راه تماس برای تمدید اشتراک
// پرداخت فقط کارت‌به‌کارت است؛ کاربر بعد از واریز تصویر رسید را داخل سایت می‌فرستد
const PAYMENT = { card: '6063731203923199', holder: 'محسن ایزی' };
const PLAN_MONTHS = [1, 3, 6];
const MAX_RECEIPT = 900 * 1024;   // حداکثر حجم تصویر رسید (data URL، بعد از کوچک‌شدن در مرورگر)
const MAX_RECEIPTS_PER_LEAD = 5;
const LEAD_STATUSES = ['new', 'contacted', 'paid', 'done', 'rejected'];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
const expiredError = (shopName) => new HttpError(403, 'اشتراک این آرایشگاه به پایان رسیده است', { expired: true, support: SUPPORT, shopName });

const toEn = (v) =>
  String(v ?? '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
    .trim();

/* ---------------------------------------------------------------- crypto */
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64url = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (str) => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
const sha256 = async (text) => hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
// مقایسه در زمان ثابت تا از مدت پاسخ نشود فهمید چند کاراکتر اول درست بوده است
function safeEqual(a, b) {
  a = String(a ?? ''); b = String(b ?? '');
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  return diff === 0;
}

async function hashPassword(password) {
  const salt = randomHex(16);
  return `${salt}$${await sha256(`${salt}:${password}`)}`;
}
async function checkPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split('$');
  return safeEqual(await sha256(`${salt}:${password}`), hash);
}
// بخشی از هش رمز در توکن قرار می‌گیرد تا با تغییر رمز، توکن‌های قبلی باطل شوند
const passMark = (stored) => (stored || '').slice(-12);

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/* ---------------------------------------------------------------- schema */
let ready = null;
let secret = null;
function init(db) {
  ready ??= migrate(db).catch((err) => { ready = null; throw err; });
  return ready;
}

async function migrate(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL,
      data TEXT NOT NULL, version INTEGER NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS accounts (
      shop_id TEXT NOT NULL, username TEXT NOT NULL, pass TEXT NOT NULL,
      role TEXT NOT NULL, barber_id TEXT, PRIMARY KEY (shop_id, username))`),
    db.prepare('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, note TEXT NOT NULL,
      source_shop TEXT, status TEXT NOT NULL DEFAULT 'new', ip TEXT, created_at INTEGER NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY, lead_id TEXT, shop_id TEXT, plan INTEGER NOT NULL, image TEXT NOT NULL, created_at INTEGER NOT NULL)`),
    db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('secret', ?)").bind(randomHex(32)),
  ]);
  secret = (await db.prepare("SELECT value FROM meta WHERE key = 'secret'").first()).value;
  // ستون‌هایی که بعداً اضافه شده‌اند
  for (const [table, col] of [['shops', 'active INTEGER NOT NULL DEFAULT 1'], ['shops', "telegram TEXT NOT NULL DEFAULT ''"],
    ['shops', "instagram TEXT NOT NULL DEFAULT ''"], ['shops', "expires_at TEXT NOT NULL DEFAULT ''"],
    ['leads', "shop_name TEXT NOT NULL DEFAULT ''"], ['leads', "city TEXT NOT NULL DEFAULT ''"],
    ['leads', 'plan INTEGER NOT NULL DEFAULT 0'], ['leads', "token TEXT NOT NULL DEFAULT ''"],
    ['receipts', "status TEXT NOT NULL DEFAULT 'new'"], ['leads', "shop_id TEXT NOT NULL DEFAULT ''"],
    ['shops', "owner_name TEXT NOT NULL DEFAULT ''"], ['shops', "owner_phone TEXT NOT NULL DEFAULT ''"]]) {
    try {
      await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col}`).run();
    } catch (err) {
      if (!/duplicate column/i.test(String(err && err.message))) throw err;
    }
  }

  // داده‌های نسخهٔ تک‌آرایشگاهی قبلی به اولین آرایشگاه منتقل می‌شود
  const old = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'store'").first();
  if (old) {
    await db.batch([
      db.prepare(`INSERT OR IGNORE INTO shops (id, name, location, data, version, created_at)
        SELECT 'main', COALESCE(json_extract(data, '$.settings.shopName'), 'آرایشگاه من'), '', data, version, ?
        FROM store WHERE id = 1`).bind(Date.now()),
      db.prepare('DROP TABLE store'),
    ]);
  }

  // آرایشگاه‌هایی که از قبل بوده‌اند هم از امروز ۳۰ روز اشتراک رایگان می‌گیرند
  await db.prepare("UPDATE shops SET expires_at = ? WHERE expires_at = ''").bind(addDaysISO(localNow().date, FREE_DAYS)).run();
}

/* ---------------------------------------------------------------- auth */
// اطلاعات ورود مدیر سایت فقط از Secretهای Cloudflare خوانده می‌شود، نه از کد
function adminCreds(env) {
  const username = toEn(env.ADMIN_USERNAME).toLowerCase();
  const password = String(env.ADMIN_PASSWORD ?? '');
  return username && password ? { username, password } : null;
}
async function superMark(env) {
  const c = adminCreds(env);
  return c ? (await sha256(`${c.username}:${c.password}`)).slice(-12) : null;
}
function isSuperLogin(env, username, password) {
  const c = adminCreds(env);
  if (!c) return false;
  const userOk = safeEqual(toEn(username).toLowerCase(), c.username);
  const passOk = safeEqual(String(password ?? ''), c.password);
  return userOk && passOk;
}

async function makeToken(payload) {
  const body = b64url(JSON.stringify({ ...payload, e: Date.now() + TOKEN_DAYS * 864e5 }));
  return `${body}.${await hmac(secret, body)}`;
}

async function readAuth(request, env, db) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [body, sig] = token.split('.');
  if (!body || !sig || !safeEqual(sig, await hmac(secret, body))) return null;
  let p;
  try { p = JSON.parse(unb64url(body)); } catch { return null; }
  if (!p || p.e < Date.now()) return null;
  if (p.r === 'super') { const m = await superMark(env); return m && safeEqual(p.h, m) ? p : null; }
  const acc = await db.prepare(`SELECT a.pass, a.role, a.barber_id, s.active, s.expires_at FROM accounts a
    JOIN shops s ON s.id = a.shop_id WHERE a.shop_id = ? AND a.username = ?`).bind(p.s, p.u).first();
  if (!acc || acc.role !== p.r || !safeEqual(passMark(acc.pass), p.h)) return null;
  const sub = subStatus(acc.expires_at);
  return {
    ...p, b: acc.barber_id,
    disabled: !acc.active || sub.state === 'expired', expired: sub.state === 'expired', readonly: sub.state === 'grace',
  };
}

function requireAuth(auth) {
  if (!auth) throw new HttpError(401, 'ابتدا وارد شوید');
}
function requireShop(auth, shopId, roles) {
  requireAuth(auth);
  if (auth.r === 'super') return;
  if (auth.expired) throw expiredError();
  if (auth.disabled) throw new HttpError(403, 'این آرایشگاه غیرفعال شده است');
  if (auth.s !== shopId || !roles.includes(auth.r)) throw new HttpError(403, 'به این بخش دسترسی ندارید');
}

// در مهلت ۷ روزهٔ بعد از پایان اشتراک، مالک و آرایشگرها فقط می‌توانند ببینند
function requireWritable(auth) {
  if (auth.r !== 'super' && auth.readonly) {
    throw new HttpError(403, 'اشتراک این آرایشگاه تمام شده و پنل فقط قابل مشاهده است', { readonly: true, support: SUPPORT });
  }
}

/* ---------------------------------------------------------------- helpers */
function localNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

const addDaysISO = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const diffDays = (from, to) => Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 864e5);

// وضعیت اشتراک بر اساس تاریخ ایران. expiresAt آخرین روز اشتراک است (همان روز هنوز فعال است).
function subStatus(expiresAt) {
  if (!expiresAt) return { state: 'active', expiresAt: null, daysLeft: null };
  const left = diffDays(localNow().date, expiresAt);
  if (left >= 0) return { state: left < WARN_DAYS ? 'warning' : 'active', expiresAt, daysLeft: left };
  if (left >= -GRACE_DAYS) return { state: 'grace', expiresAt, daysLeft: left, graceLeft: GRACE_DAYS + left };
  return { state: 'expired', expiresAt, daysLeft: left };
}

// نوبت جدید یا جابه‌جا شده نباید در روز یا ساعت گذشته باشد
function assertNotPast(prevList, nextList) {
  const now = localNow();
  const prev = new Map(prevList.map((a) => [a.id, a]));
  for (const a of nextList) {
    const old = prev.get(a.id);
    if (old && old.date === a.date && old.start === a.start) continue;
    const [h, m] = String(a.start).split(':').map(Number);
    if (a.date < now.date || (a.date === now.date && h * 60 + m < now.min - PAST_GRACE_MIN)) {
      throw new HttpError(400, 'ثبت نوبت برای روز یا ساعت گذشته ممکن نیست');
    }
  }
}

function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

function cleanUsername(v) {
  const u = toEn(v).toLowerCase();
  if (!USERNAME_RE.test(u)) throw new HttpError(400, 'نام کاربری باید ۳ تا ۳۲ حرف انگلیسی، عدد یا . _ - باشد');
  return u;
}
function cleanPassword(v) {
  const p = toEn(v);
  if (p.length < 4) throw new HttpError(400, 'رمز عبور باید حداقل ۴ کاراکتر باشد');
  if (p.length > 64) throw new HttpError(400, 'رمز عبور طولانی است');
  return p;
}

function cleanShop(body) {
  const name = String(body?.name || '').trim();
  const location = String(body?.location || '').trim();
  if (!name) throw new HttpError(400, 'نام آرایشگاه را وارد کنید');
  if (!location) throw new HttpError(400, 'لوکیشن آرایشگاه را وارد کنید');
  if (name.length > 60) throw new HttpError(400, 'نام آرایشگاه طولانی است');
  if (location.length > 300) throw new HttpError(400, 'لوکیشن طولانی است');
  return {
    name, location,
    telegram: cleanSocial(body?.telegram, /(?:t\.me|telegram\.me)\/([^/?#]+)/i, /^[a-z0-9_]{4,32}$/i, 'آیدی تلگرام'),
    instagram: cleanSocial(body?.instagram, /instagram\.com\/([^/?#]+)/i, /^[a-z0-9._]{1,30}$/i, 'آیدی اینستاگرام'),
  };
}

// نام و تلفن مالک (اختیاری): فقط برای مدیر سایت، برای تماس و تمدید؛ به مشتری‌ها نمایش داده نمی‌شود
function cleanOwnerContact(body) {
  const ownerName = String(body?.ownerName || '').trim();
  const raw = String(body?.ownerPhone || '').trim();
  if (ownerName.length > 60) throw new HttpError(400, 'نام مالک طولانی است');
  const ownerPhone = raw ? cleanPhone(raw) : '';
  if (raw && !ownerPhone) throw new HttpError(400, 'شماره تلفن مالک معتبر نیست');
  return { ownerName, ownerPhone };
}

// صفحات مجازی اختیاری‌اند؛ آیدی یا لینک کامل پذیرفته و فقط آیدی ذخیره می‌شود
function cleanSocial(value, urlRe, idRe, label) {
  let v = String(value || '').trim();
  if (!v) return '';
  const m = v.match(urlRe);
  if (m) v = m[1];
  v = v.replace(/^@/, '');
  if (!idRe.test(v)) throw new HttpError(400, `${label} معتبر نیست`);
  return v;
}

// شمارهٔ موبایل به شکل یکسان 09xxxxxxxxx ذخیره می‌شود تا سفارش تکراری ساخته نشود؛ تلفن ثابت هم پذیرفته است
function cleanPhone(v) {
  const p = toEn(v).replace(/[\s-]/g, '');
  const m = p.match(/^(?:\+98|0098|0)?(9\d{9})$/);
  if (m) return '0' + m[1];
  return /^0\d{10}$/.test(p) ? p : '';
}

function cleanReceipt(v) {
  const image = String(v || '');
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) throw new HttpError(400, 'تصویر رسید معتبر نیست');
  if (image.length > MAX_RECEIPT) throw new HttpError(413, 'حجم تصویر رسید زیاد است');
  return image;
}

// آخرین رسید تمدیدی که هنوز بررسی نشده (برای نمایش «در انتظار تأیید» در پنل مالک)
async function pendingRenewal(db, shopId) {
  return (await db.prepare(`SELECT plan, created_at AS createdAt FROM receipts
    WHERE shop_id = ? AND status = 'new' ORDER BY created_at DESC LIMIT 1`).bind(shopId).first()) || null;
}

// وضعیت سفارش برای خود کاربر (بدون اطلاعات داخلی مثل IP)
async function leadView(db, token) {
  const row = await db.prepare(`SELECT l.id, l.name, l.phone, l.shop_name AS shopName, l.city, l.plan, l.status,
    (SELECT COUNT(*) FROM receipts r WHERE r.lead_id = l.id) AS receipts,
    (SELECT MAX(created_at) FROM receipts r WHERE r.lead_id = l.id) AS receiptAt
    FROM leads l WHERE l.token = ?`).bind(token).first();
  return row || null;
}

async function getShop(db, id) {
  const row = await db.prepare('SELECT id, name, location, telegram, instagram, data, version, active, expires_at FROM shops WHERE id = ?').bind(id).first();
  if (!row) throw new HttpError(404, 'آرایشگاه پیدا نشد');
  return {
    shop: {
      id: row.id, name: row.name, location: row.location, active: !!row.active, sub: subStatus(row.expires_at),
      telegram: row.telegram || '', instagram: row.instagram || '',
    },
    data: JSON.parse(row.data), version: row.version,
  };
}

async function usernameTaken(db, shopId, username, except) {
  const row = await db.prepare('SELECT barber_id, role FROM accounts WHERE shop_id = ? AND username = ?').bind(shopId, username).first();
  if (!row) return false;
  return !(except && except(row));
}

async function setOwner(db, shopId, usernameRaw, passwordRaw, isNew) {
  const current = await db.prepare("SELECT username, pass FROM accounts WHERE shop_id = ? AND role = 'owner'").bind(shopId).first();
  const username = usernameRaw != null && String(usernameRaw).trim() !== '' ? cleanUsername(usernameRaw) : current?.username;
  const hasPass = passwordRaw != null && String(passwordRaw) !== '';
  if (!username) throw new HttpError(400, 'نام کاربری مالک را وارد کنید');
  if (!current && !hasPass) throw new HttpError(400, 'رمز عبور مالک را وارد کنید');
  if (!isNew && username === current?.username && !hasPass) return [];
  if (await usernameTaken(db, shopId, username, (r) => r.role === 'owner')) throw new HttpError(409, 'این نام کاربری قبلاً استفاده شده است');
  const pass = hasPass ? await hashPassword(cleanPassword(passwordRaw)) : current.pass;
  return [
    db.prepare("DELETE FROM accounts WHERE shop_id = ? AND role = 'owner'").bind(shopId),
    db.prepare("INSERT INTO accounts (shop_id, username, pass, role, barber_id) VALUES (?, ?, ?, 'owner', NULL)").bind(shopId, username, pass),
  ];
}

async function shopAccounts(db, shopId) {
  const { results } = await db.prepare('SELECT username, role, barber_id FROM accounts WHERE shop_id = ?').bind(shopId).all();
  return {
    owner: results.find((r) => r.role === 'owner')?.username || null,
    barbers: Object.fromEntries(results.filter((r) => r.role === 'barber').map((r) => [r.barber_id, r.username])),
  };
}

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new HttpError(413, 'حجم داده بیش از حد مجاز است');
  try { return JSON.parse(raw || '{}'); } catch { throw new HttpError(400, 'درخواست نامعتبر است'); }
}

// نمای مشتری فقط بازه‌های پر را می‌گیرد، نه نام و شمارهٔ مشتری‌ها
function publicView({ shop, data }) {
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const { sub, ...publicShop } = shop; // وضعیت اشتراک برای مشتری‌ها لازم نیست
  return {
    shop: publicShop,
    barbers: data.barbers || [],
    busy: (data.appointments || [])
      .filter((a) => a.date >= yesterday)
      .map((a) => ({ barberId: a.barberId, date: a.date, start: a.start, end: a.end })),
  };
}

/* ---------------------------------------------------------------- routes */
async function handleApi(request, env, path) {
  if (!env.DB) throw new HttpError(500, 'دیتابیس به Worker متصل نشده است (binding با نام DB)');
  const db = env.DB;
  await init(db);
  const method = request.method;
  const parts = path.split('/').filter(Boolean).slice(1); // بدون «api»
  const superToken = async () => ({
    token: await makeToken({ r: 'super', h: await superMark(env) }),
    role: 'super', name: String(env.ADMIN_USERNAME || '').trim() || 'مدیر سایت',
  });
  const auth = await readAuth(request, env, db);

  // ---- ورود مدیر سایت (صفحهٔ اصلی)
  if (method === 'POST' && path === '/api/login') {
    const { username, password } = await readJson(request);
    if (!adminCreds(env)) throw new HttpError(503, 'حساب مدیر سایت در Cloudflare تنظیم نشده است (ADMIN_USERNAME و ADMIN_PASSWORD)');
    if (!isSuperLogin(env, username, password)) throw new HttpError(401, 'نام کاربری یا رمز عبور اشتباه است');
    return json(await superToken());
  }

  // ---- عمومی
  if (parts[0] === 'shops') {
    const id = parts[1];
    if (method === 'GET' && parts.length === 1) {
      // آرایشگاه‌های غیرفعال فقط برای مدیر سایت نمایش داده می‌شوند
      const all = auth?.r === 'super';
      const { results } = await db.prepare(`SELECT id, name, location, active, expires_at,
        owner_name AS ownerName, owner_phone AS ownerPhone,
        COALESCE(json_array_length(data, '$.barbers'), 0) AS barbers
        FROM shops ORDER BY created_at`).all();
      const shops = results
        .map(({ expires_at: e, ...r }) => ({ ...r, active: !!r.active, sub: subStatus(e) }))
        .filter((r) => all || (r.active && r.sub.state !== 'expired'));
      return json({ shops: all ? shops : shops.map(({ sub, ownerName, ownerPhone, ...r }) => r) });
    }
    if (method === 'GET' && parts.length === 2) {
      const shop = await getShop(db, id);
      // صفحهٔ مشتری آرایشگاه منقضی برای همه (حتی مدیر سایت) پیام پایان اشتراک را نشان می‌دهد؛ پنل مدیریت جداست
      if (shop.shop.sub.state === 'expired') throw expiredError(shop.shop.name);
      if (!shop.shop.active && auth?.r !== 'super') throw new HttpError(403, 'این آرایشگاه در حال حاضر غیرفعال است');
      return json(publicView(shop));
    }

    // ورود مالک یا آرایشگر یک آرایشگاه
    if (method === 'POST' && parts[2] === 'login' && parts.length === 3) {
      const { username, password } = await readJson(request);
      const u = toEn(username).toLowerCase();
      const { shop, data } = await getShop(db, id);
      if (isSuperLogin(env, username, password)) return json(await superToken());
      if (shop.sub.state === 'expired') throw expiredError(shop.name);
      if (!shop.active) throw new HttpError(403, 'این آرایشگاه غیرفعال شده است');
      const acc = await db.prepare('SELECT username, pass, role, barber_id FROM accounts WHERE shop_id = ? AND username = ?').bind(id, u).first();
      if (!acc || !(await checkPassword(toEn(password), acc.pass))) throw new HttpError(401, 'نام کاربری یا رمز عبور اشتباه است');
      const name = acc.role === 'owner' ? `مالک ${shop.name}` : (data.barbers.find((b) => b.id === acc.barber_id)?.name || acc.username);
      return json({
        token: await makeToken({ r: acc.role, s: id, u: acc.username, h: passMark(acc.pass) }),
        role: acc.role, shopId: id, barberId: acc.barber_id, name,
      });
    }
    throw new HttpError(404, 'مسیر پیدا نشد');
  }

  // ---- راه‌های تماس با پشتیبانی (برای صفحهٔ درخواست ساخت سایت)
  if (method === 'GET' && path === '/api/support') return json({ support: SUPPORT, payment: PAYMENT });

  // ---- درخواست ساخت سایت از صفحهٔ «تو هم می‌خواهی؟» (عمومی)
  // هر شماره تلفن یک سفارش دارد؛ توکن سفارش در مرورگر کاربر می‌ماند تا بعداً پرداخت و ارسال رسید را ادامه دهد
  if (method === 'POST' && path === '/api/leads') {
    const body = await readJson(request);
    if (body.website) return json({ ok: true }); // فیلد مخفی ضد ربات
    const name = String(body.name || '').trim();
    const phone = cleanPhone(body.phone);
    const note = String(body.note || '').trim();
    const shopName = String(body.shopName || '').trim();
    const city = String(body.city || '').trim();
    const plan = Number(body.plan);
    if (name.length < 2 || name.length > 60) throw new HttpError(400, 'نام را وارد کنید');
    if (shopName.length < 2 || shopName.length > 60) throw new HttpError(400, 'نام آرایشگاه را وارد کنید');
    if (!phone) throw new HttpError(400, 'شماره تماس معتبر نیست');
    if (!PLAN_MONTHS.includes(plan)) throw new HttpError(400, 'یک پلن انتخاب کنید');
    if (city.length > 40) throw new HttpError(400, 'نام شهر طولانی است');
    if (note.length > 600) throw new HttpError(400, 'توضیحات طولانی است');
    const ip = request.headers.get('cf-connecting-ip') || '';
    const recent = await db.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip = ? AND created_at > ?').bind(ip, Date.now() - 3600e3).first();
    if (ip && recent.n >= 5) throw new HttpError(429, 'تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید');
    const source = String(body.source || '').slice(0, 20) || null;
    // اگر این شماره قبلاً سفارش داده، همان سفارش به‌روز می‌شود (نه یک سفارش تکراری)
    const old = await db.prepare('SELECT id, token FROM leads WHERE phone = ? ORDER BY created_at DESC LIMIT 1').bind(phone).first();
    const token = old?.token || randomHex(16);
    if (old) {
      await db.prepare('UPDATE leads SET name = ?, shop_name = ?, city = ?, note = ?, plan = ?, token = ? WHERE id = ?')
        .bind(name, shopName, city, note, plan, token, old.id).run();
    } else {
      await db.prepare(`INSERT INTO leads (id, name, phone, shop_name, city, note, plan, token, source_shop, status, ip, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`).bind(newId(), name, phone, shopName, city, note, plan, token, source, ip, Date.now()).run();
    }
    return json({ token, order: await leadView(db, token), support: SUPPORT, payment: PAYMENT });
  }

  // ---- سفارش من (با توکنی که در مرورگر کاربر ذخیره شده)
  if (parts[0] === 'leads' && parts[1] === 'me') {
    const token = request.headers.get('x-lead-token') || '';
    const order = token ? await leadView(db, token) : null;
    if (!order) throw new HttpError(404, 'سفارش پیدا نشد');
    if (method === 'GET' && parts.length === 2) return json({ order, support: SUPPORT, payment: PAYMENT });
    // تغییر پلن قبل از پرداخت
    if (method === 'PUT' && parts.length === 2) {
      const plan = Number((await readJson(request)).plan);
      if (!PLAN_MONTHS.includes(plan)) throw new HttpError(400, 'یک پلن انتخاب کنید');
      await db.prepare('UPDATE leads SET plan = ? WHERE id = ?').bind(plan, order.id).run();
      return json({ order: await leadView(db, token) });
    }
    // ارسال تصویر رسید پرداخت
    if (method === 'POST' && parts[2] === 'receipt' && parts.length === 3) {
      const image = cleanReceipt((await readJson(request)).image);
      if (order.receipts >= MAX_RECEIPTS_PER_LEAD) throw new HttpError(429, 'تعداد رسیدهای ارسالی زیاد است؛ با پشتیبانی تماس بگیرید');
      await db.batch([
        db.prepare('INSERT INTO receipts (id, lead_id, shop_id, plan, image, created_at) VALUES (?, ?, NULL, ?, ?, ?)')
          .bind(newId(), order.id, order.plan || 0, image, Date.now()),
        db.prepare("UPDATE leads SET status = 'paid' WHERE id = ? AND status IN ('new', 'contacted')").bind(order.id),
      ]);
      return json({ order: await leadView(db, token) });
    }
    throw new HttpError(404, 'مسیر پیدا نشد');
  }

  // ---- رسیدهای تمدید آرایشگاه‌ها (فقط مدیر سایت)
  if (parts[0] === 'admin' && parts[1] === 'renewals') {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'به این بخش دسترسی ندارید');
    const rid = parts[2];
    if (method === 'GET' && !rid) {
      const { results } = await db.prepare(`SELECT r.id, r.shop_id AS shopId, r.plan, r.status, r.created_at AS createdAt,
        s.name AS shopName, s.expires_at AS expiresAt FROM receipts r LEFT JOIN shops s ON s.id = r.shop_id
        WHERE r.shop_id IS NOT NULL ORDER BY r.created_at DESC LIMIT 300`).all();
      return json({ renewals: results.map(({ expiresAt, ...r }) => ({ ...r, sub: expiresAt != null ? subStatus(expiresAt) : null })) });
    }
    // تأیید: اشتراک به اندازهٔ پلن (هر ماه ۳۰ روز) از پایان فعلی یا از امروز تمدید می‌شود · رد: فقط وضعیت رسید
    if (method === 'PUT' && rid && parts.length === 3) {
      const { action } = await readJson(request);
      const r = await db.prepare('SELECT id, shop_id, plan, status FROM receipts WHERE id = ? AND shop_id IS NOT NULL').bind(rid).first();
      if (!r) throw new HttpError(404, 'رسید پیدا نشد');
      if (r.status !== 'new') throw new HttpError(409, 'این رسید قبلاً بررسی شده است');
      if (action === 'reject') {
        await db.prepare("UPDATE receipts SET status = 'rejected' WHERE id = ?").bind(rid).run();
        return json({ id: rid, status: 'rejected' });
      }
      if (action !== 'approve') throw new HttpError(400, 'درخواست نامعتبر است');
      const shop = await db.prepare('SELECT expires_at FROM shops WHERE id = ?').bind(r.shop_id).first();
      if (!shop) throw new HttpError(404, 'آرایشگاه پیدا نشد');
      const today = localNow().date;
      const base = shop.expires_at && shop.expires_at >= today ? shop.expires_at : today;
      const expiresAt = addDaysISO(base, r.plan * 30);
      await db.batch([
        db.prepare('UPDATE shops SET expires_at = ? WHERE id = ?').bind(expiresAt, r.shop_id),
        db.prepare("UPDATE receipts SET status = 'done' WHERE id = ?").bind(rid),
      ]);
      return json({ id: rid, status: 'done', sub: subStatus(expiresAt) });
    }
    throw new HttpError(404, 'مسیر پیدا نشد');
  }

  // ---- تصویر یک رسید (فقط مدیر سایت)
  if (parts[0] === 'admin' && parts[1] === 'receipts' && parts[2] && parts.length === 3 && method === 'GET') {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'به این بخش دسترسی ندارید');
    const row = await db.prepare('SELECT image FROM receipts WHERE id = ?').bind(parts[2]).first();
    if (!row) throw new HttpError(404, 'رسید پیدا نشد');
    return json({ image: row.image });
  }

  // ---- مدیریت درخواست‌ها (فقط مدیر سایت)
  if (parts[0] === 'admin' && parts[1] === 'leads') {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'به این بخش دسترسی ندارید');
    const leadId = parts[2];
    if (method === 'GET' && !leadId) {
      const { results } = await db.prepare(`SELECT l.id, l.name, l.phone, l.shop_name AS shopName, l.city, l.note, l.plan, l.status, l.created_at AS createdAt,
        (SELECT r.id FROM receipts r WHERE r.lead_id = l.id ORDER BY r.created_at DESC LIMIT 1) AS receiptId,
        (SELECT COUNT(*) FROM receipts r WHERE r.lead_id = l.id) AS receipts,
        l.source_shop AS sourceShop, s.name AS sourceName,
        (SELECT c.id FROM shops c WHERE c.id = l.shop_id) AS shopId
        FROM leads l LEFT JOIN shops s ON s.id = l.source_shop
        ORDER BY l.created_at DESC LIMIT 300`).all();
      return json({ leads: results });
    }
    if (method === 'PUT' && leadId) {
      const { status } = await readJson(request);
      if (!LEAD_STATUSES.includes(status)) throw new HttpError(400, 'وضعیت نامعتبر است');
      const res = await db.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(status, leadId).run();
      if (!res.meta.changes) throw new HttpError(404, 'درخواست پیدا نشد');
      return json({ id: leadId, status });
    }
    if (method === 'DELETE' && leadId) {
      await db.batch([
        db.prepare('DELETE FROM leads WHERE id = ?').bind(leadId),
        db.prepare('DELETE FROM receipts WHERE lead_id = ?').bind(leadId),
      ]);
      return json({ id: leadId });
    }
    throw new HttpError(404, 'مسیر پیدا نشد');
  }

  // ---- بخش‌های نیازمند ورود
  if (parts[0] !== 'admin' || parts[1] !== 'shops') throw new HttpError(404, 'مسیر پیدا نشد');
  const id = parts[2];

  // ساخت آرایشگاه + مالک (فقط مدیر سایت)
  if (method === 'POST' && !id) {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند آرایشگاه اضافه کند');
    const body = await readJson(request);
    // ساخت از روی درخواست سایت: اشتراک به اندازهٔ پلن سفارش (هر ماه ۳۰ روز) و درخواست «ساخته شد» می‌شود
    let lead = null;
    if (body.leadId) {
      lead = await db.prepare('SELECT id, plan, shop_id FROM leads WHERE id = ?').bind(String(body.leadId)).first();
      if (!lead) throw new HttpError(404, 'درخواست پیدا نشد');
      if (lead.shop_id && await db.prepare('SELECT id FROM shops WHERE id = ?').bind(lead.shop_id).first()) {
        throw new HttpError(409, 'برای این درخواست قبلاً آرایشگاه ساخته شده است');
      }
    }
    // پلن انتخابی مدیر سایت در فرم بر پلن سفارش مقدم است
    const plan = PLAN_MONTHS.includes(Number(body.plan)) ? Number(body.plan) : lead && PLAN_MONTHS.includes(lead.plan) ? lead.plan : 0;
    const days = plan ? plan * 30 : FREE_DAYS;
    const shop = { id: newId(), ...cleanShop(body), ...cleanOwnerContact(body), expiresAt: addDaysISO(localNow().date, days) };
    const ownerOps = await setOwner(db, shop.id, body.ownerUsername, body.ownerPassword, true);
    await db.batch([
      db.prepare(`INSERT INTO shops (id, name, location, telegram, instagram, owner_name, owner_phone, expires_at, data, version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`)
        .bind(shop.id, shop.name, shop.location, shop.telegram, shop.instagram, shop.ownerName, shop.ownerPhone, shop.expiresAt, JSON.stringify(EMPTY), Date.now()),
      ...ownerOps,
      ...(lead ? [db.prepare("UPDATE leads SET status = 'done', shop_id = ?, plan = ? WHERE id = ?").bind(shop.id, plan || lead.plan, lead.id)] : []),
    ]);
    return json(shop);
  }

  if (id && parts.length === 3) {
    // ویرایش نام، لوکیشن، صفحات مجازی و اطلاعات ورود مالک (مدیر سایت یا خود مالک)
    if (method === 'PUT') {
      requireShop(auth, id, ['owner']);
      requireWritable(auth);
      const body = await readJson(request);
      const info = cleanShop(body);
      await getShop(db, id);
      const ownerOps = await setOwner(db, id, body.ownerUsername, body.ownerPassword, false);
      // نام و تلفن مالک را فقط مدیر سایت (از فرم ویرایش خودش) تغییر می‌دهد
      const contact = auth.r === 'super' && ('ownerName' in body || 'ownerPhone' in body) ? cleanOwnerContact(body) : null;
      await db.batch([
        db.prepare('UPDATE shops SET name = ?, location = ?, telegram = ?, instagram = ? WHERE id = ?')
          .bind(info.name, info.location, info.telegram, info.instagram, id),
        ...(contact ? [db.prepare('UPDATE shops SET owner_name = ?, owner_phone = ? WHERE id = ?').bind(contact.ownerName, contact.ownerPhone, id)] : []),
        ...ownerOps,
      ]);
      return json({ id, ...info, owner: (await shopAccounts(db, id)).owner });
    }
    // حذف آرایشگاه (فقط مدیر سایت)
    if (method === 'DELETE') {
      requireAuth(auth);
      if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند آرایشگاه را حذف کند');
      const res = await db.prepare('DELETE FROM shops WHERE id = ?').bind(id).run();
      if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
      await db.batch([
        db.prepare('DELETE FROM accounts WHERE shop_id = ?').bind(id),
        db.prepare('DELETE FROM receipts WHERE shop_id = ?').bind(id),
      ]);
      return json({ id });
    }
  }

  if (id && parts[3] === 'data' && parts.length === 4) {
    requireShop(auth, id, ['owner', 'barber']);
    const cur = await getShop(db, id);

    if (method === 'GET') {
      if (auth.r === 'barber') {
        // آرایشگر فقط پروفایل و نوبت‌های خودش را می‌بیند
        cur.data = {
          barbers: cur.data.barbers.filter((b) => b.id === auth.b),
          appointments: cur.data.appointments.filter((a) => a.barberId === auth.b),
        };
        return json({ ...cur, role: 'barber', barberId: auth.b, support: SUPPORT });
      }
      return json({
        ...cur, role: auth.r, accounts: await shopAccounts(db, id), support: SUPPORT, payment: PAYMENT,
        renewal: await pendingRenewal(db, id),
      });
    }

    if (method === 'PUT') {
      requireWritable(auth);
      const { data, version } = await readJson(request);
      if (!data || !Array.isArray(data.barbers) || !Array.isArray(data.appointments) || !Number.isInteger(version)) {
        throw new HttpError(400, 'درخواست نامعتبر است');
      }
      if (version !== cur.version) throw new HttpError(409, 'داده‌ها هم‌زمان از دستگاه دیگری تغییر کرده است');
      // آرایشگاه غیرفعال یا منقضی نوبت جدید نمی‌پذیرد (حتی از مدیر سایت)؛ ویرایش و حذف نوبت‌های قبلی آزاد است
      if (!cur.shop.active || cur.shop.sub.state === 'expired') {
        const known = new Set(cur.data.appointments.map((a) => a.id));
        if (data.appointments.some((a) => !known.has(a.id))) {
          throw new HttpError(403, 'این آرایشگاه غیرفعال است و نوبت جدید ثبت نمی‌شود');
        }
      }
      let next;
      if (auth.r === 'barber') {
        // آرایشگر نمی‌تواند آرایشگرها یا نوبت‌های دیگران را تغییر دهد
        next = {
          barbers: cur.data.barbers,
          appointments: [
            ...cur.data.appointments.filter((a) => a.barberId !== auth.b),
            ...data.appointments.filter((a) => a.barberId === auth.b),
          ],
        };
      } else {
        next = { barbers: data.barbers, appointments: data.appointments };
      }
      assertNotPast(cur.data.appointments, next.appointments);
      const ops = [
        db.prepare('UPDATE shops SET data = ?, version = version + 1 WHERE id = ? AND version = ?').bind(JSON.stringify(next), id, version),
      ];
      if (auth.r !== 'barber') {
        // حساب آرایشگرهای حذف‌شده پاک می‌شود
        ops.push(db.prepare(`DELETE FROM accounts WHERE shop_id = ? AND role = 'barber'
          AND barber_id NOT IN (SELECT value FROM json_each(?))`).bind(id, JSON.stringify(next.barbers.map((b) => b.id))));
      }
      const [res] = await db.batch(ops);
      if (!res.meta.changes) throw new HttpError(409, 'داده‌ها هم‌زمان از دستگاه دیگری تغییر کرده است');
      return json({ version: version + 1 });
    }
  }

  // فعال یا غیرفعال کردن آرایشگاه (فقط مدیر سایت)
  if (id && parts[3] === 'status' && parts.length === 4 && method === 'PUT') {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند آرایشگاه را غیرفعال کند');
    const { active } = await readJson(request);
    const res = await db.prepare('UPDATE shops SET active = ? WHERE id = ?').bind(active ? 1 : 0, id).run();
    if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
    return json({ id, active: !!active });
  }

  // تعیین تاریخ پایان اشتراک (فقط مدیر سایت)
  if (id && parts[3] === 'subscription' && parts.length === 4 && method === 'PUT') {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند اشتراک را تغییر دهد');
    const { expiresAt } = await readJson(request);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(expiresAt)) || Number.isNaN(Date.parse(expiresAt))) {
      throw new HttpError(400, 'تاریخ پایان اشتراک نامعتبر است');
    }
    const res = await db.prepare('UPDATE shops SET expires_at = ? WHERE id = ?').bind(expiresAt, id).run();
    if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
    return json({ id, sub: subStatus(expiresAt) });
  }

  // ارسال رسید تمدید اشتراک توسط مالک؛ در مهلت «فقط مشاهده» هم مجاز است
  if (id && parts[3] === 'renewal' && parts.length === 4 && method === 'POST') {
    requireShop(auth, id, ['owner']);
    if (auth.r !== 'owner') throw new HttpError(403, 'فقط مالک آرایشگاه می‌تواند رسید تمدید بفرستد');
    const body = await readJson(request);
    const plan = Number(body.plan);
    if (!PLAN_MONTHS.includes(plan)) throw new HttpError(400, 'یک پلن انتخاب کنید');
    const image = cleanReceipt(body.image);
    const pending = await db.prepare("SELECT COUNT(*) AS n FROM receipts WHERE shop_id = ? AND status = 'new'").bind(id).first();
    if (pending.n >= MAX_RECEIPTS_PER_LEAD) throw new HttpError(429, 'تعداد رسیدهای ارسالی زیاد است؛ با پشتیبانی تماس بگیرید');
    await db.prepare("INSERT INTO receipts (id, lead_id, shop_id, plan, image, status, created_at) VALUES (?, NULL, ?, ?, ?, 'new', ?)")
      .bind(newId(), id, plan, image, Date.now()).run();
    return json({ renewal: await pendingRenewal(db, id) });
  }

  // نام کاربری و رمز آرایشگر (مالک یا مدیر سایت)
  if (id && parts[3] === 'accounts' && parts[4] && parts.length === 5) {
    requireShop(auth, id, ['owner']);
    requireWritable(auth);
    const barberId = parts[4];
    await getShop(db, id);
    if (method === 'DELETE') {
      await db.prepare("DELETE FROM accounts WHERE shop_id = ? AND role = 'barber' AND barber_id = ?").bind(id, barberId).run();
      return json({ barberId });
    }
    if (method === 'PUT') {
      const body = await readJson(request);
      const username = cleanUsername(body.username);
      const current = await db.prepare("SELECT username, pass FROM accounts WHERE shop_id = ? AND role = 'barber' AND barber_id = ?").bind(id, barberId).first();
      const hasPass = body.password != null && String(body.password) !== '';
      if (!current && !hasPass) throw new HttpError(400, 'رمز عبور آرایشگر را وارد کنید');
      if (await usernameTaken(db, id, username, (r) => r.role === 'barber' && r.barber_id === barberId)) {
        throw new HttpError(409, 'این نام کاربری قبلاً استفاده شده است');
      }
      const pass = hasPass ? await hashPassword(cleanPassword(body.password)) : current.pass;
      await db.batch([
        db.prepare("DELETE FROM accounts WHERE shop_id = ? AND role = 'barber' AND barber_id = ?").bind(id, barberId),
        db.prepare("INSERT INTO accounts (shop_id, username, pass, role, barber_id) VALUES (?, ?, ?, 'barber', ?)").bind(id, username, pass, barberId),
      ]);
      return json({ barberId, username });
    }
  }

  throw new HttpError(404, 'مسیر پیدا نشد');
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      try {
        return await handleApi(request, env, path);
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message, ...(err.extra || {}) }, err.status);
        return json({ error: 'خطای سرور: ' + (err && err.message) }, 500);
      }
    }
    // آدرس /admin همان صفحهٔ اصلی سایت است؛ app.js آن را به پنل مدیریت می‌برد
    if (path === '/admin' || path === '/admin/') {
      return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
    }
    return env.ASSETS.fetch(request);
  },
};
