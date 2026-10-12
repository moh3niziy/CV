// API سایت نوبت‌دهی روی Cloudflare Workers با دیتابیس D1.
// فایل‌های سایت (پوشهٔ public) را خود Cloudflare سرو می‌کند و فقط مسیرهای /api به این کد می‌رسند.
//
// نقش‌ها:
//   super  — مدیر سایت (رمز ADMIN_PASSWORD): ساخت/حذف آرایشگاه و تعیین مالک
//   owner  — مالک آرایشگاه: مدیریت آرایشگرها، اطلاعات آرایشگاه و همهٔ نوبت‌ها
//   barber — آرایشگر: فقط نوبت‌های خودش
//
// داده‌های هر آرایشگاه (آرایشگرها و نوبت‌ها) یک سند JSON در جدول shops است و ستون version
// جلوی بازنویسی هم‌زمان را می‌گیرد. حساب‌های کاربری در جدول accounts با رمز هش‌شده نگهداری می‌شوند.

const EMPTY = { barbers: [], appointments: [] };
const MAX_BODY = 1024 * 1024;
const TOKEN_DAYS = 30;
const USERNAME_RE = /^[a-z0-9_.-]{3,32}$/;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

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

async function hashPassword(password) {
  const salt = randomHex(16);
  return `${salt}$${await sha256(`${salt}:${password}`)}`;
}
async function checkPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split('$');
  return (await sha256(`${salt}:${password}`)) === hash;
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
    db.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES ('secret', ?)").bind(randomHex(32)),
  ]);
  secret = (await db.prepare("SELECT value FROM meta WHERE key = 'secret'").first()).value;

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
}

/* ---------------------------------------------------------------- auth */
async function makeToken(payload) {
  const body = b64url(JSON.stringify({ ...payload, e: Date.now() + TOKEN_DAYS * 864e5 }));
  return `${body}.${await hmac(secret, body)}`;
}

async function readAuth(request, env, db) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [body, sig] = token.split('.');
  if (!body || !sig || sig !== await hmac(secret, body)) return null;
  let p;
  try { p = JSON.parse(unb64url(body)); } catch { return null; }
  if (!p || p.e < Date.now()) return null;
  if (p.r === 'super') return p.h === (await sha256(toEn(env.ADMIN_PASSWORD || '1234'))).slice(-12) ? p : null;
  const acc = await db.prepare('SELECT pass, role, barber_id FROM accounts WHERE shop_id = ? AND username = ?').bind(p.s, p.u).first();
  if (!acc || acc.role !== p.r || passMark(acc.pass) !== p.h) return null;
  return { ...p, b: acc.barber_id };
}

function requireAuth(auth) {
  if (!auth) throw new HttpError(401, 'ابتدا وارد شوید');
}
function requireShop(auth, shopId, roles) {
  requireAuth(auth);
  if (auth.r === 'super') return;
  if (auth.s !== shopId || !roles.includes(auth.r)) throw new HttpError(403, 'به این بخش دسترسی ندارید');
}

/* ---------------------------------------------------------------- helpers */
function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

function cleanUsername(v) {
  const u = toEn(v).toLowerCase();
  if (!USERNAME_RE.test(u)) throw new HttpError(400, 'نام کاربری باید ۳ تا ۳۲ حرف انگلیسی، عدد یا . _ - باشد');
  if (u === 'admin') throw new HttpError(400, 'نام کاربری admin رزرو شده است');
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
  return { name, location };
}

async function getShop(db, id) {
  const row = await db.prepare('SELECT id, name, location, data, version FROM shops WHERE id = ?').bind(id).first();
  if (!row) throw new HttpError(404, 'آرایشگاه پیدا نشد');
  return { shop: { id: row.id, name: row.name, location: row.location }, data: JSON.parse(row.data), version: row.version };
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
  return {
    shop,
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
  const adminPass = toEn(env.ADMIN_PASSWORD || '1234');
  const superToken = async () => ({ token: await makeToken({ r: 'super', h: (await sha256(adminPass)).slice(-12) }), role: 'super', name: 'مدیر سایت' });

  // ---- ورود مدیر سایت (صفحهٔ اصلی)
  if (method === 'POST' && path === '/api/login') {
    const { password } = await readJson(request);
    if (toEn(password) !== adminPass) throw new HttpError(401, 'رمز عبور اشتباه است');
    return json(await superToken());
  }

  // ---- عمومی
  if (parts[0] === 'shops') {
    const id = parts[1];
    if (method === 'GET' && parts.length === 1) {
      const { results } = await db.prepare(`SELECT id, name, location,
        COALESCE(json_array_length(data, '$.barbers'), 0) AS barbers
        FROM shops ORDER BY created_at`).all();
      return json({ shops: results });
    }
    if (method === 'GET' && parts.length === 2) return json(publicView(await getShop(db, id)));

    // ورود مالک یا آرایشگر یک آرایشگاه
    if (method === 'POST' && parts[2] === 'login' && parts.length === 3) {
      const { username, password } = await readJson(request);
      const u = toEn(username).toLowerCase();
      const { shop, data } = await getShop(db, id);
      if (u === 'admin' && toEn(password) === adminPass) return json(await superToken());
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

  // ---- بخش‌های نیازمند ورود
  if (parts[0] !== 'admin' || parts[1] !== 'shops') throw new HttpError(404, 'مسیر پیدا نشد');
  const auth = await readAuth(request, env, db);
  const id = parts[2];

  // ساخت آرایشگاه + مالک (فقط مدیر سایت)
  if (method === 'POST' && !id) {
    requireAuth(auth);
    if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند آرایشگاه اضافه کند');
    const body = await readJson(request);
    const { name, location } = cleanShop(body);
    const shop = { id: newId(), name, location };
    const ownerOps = await setOwner(db, shop.id, body.ownerUsername, body.ownerPassword, true);
    await db.batch([
      db.prepare('INSERT INTO shops (id, name, location, data, version, created_at) VALUES (?, ?, ?, ?, 1, ?)')
        .bind(shop.id, name, location, JSON.stringify(EMPTY), Date.now()),
      ...ownerOps,
    ]);
    return json(shop);
  }

  if (id && parts.length === 3) {
    // ویرایش نام، لوکیشن و اطلاعات ورود مالک (مدیر سایت یا خود مالک)
    if (method === 'PUT') {
      requireShop(auth, id, ['owner']);
      const body = await readJson(request);
      const { name, location } = cleanShop(body);
      await getShop(db, id);
      const ownerOps = await setOwner(db, id, body.ownerUsername, body.ownerPassword, false);
      await db.batch([db.prepare('UPDATE shops SET name = ?, location = ? WHERE id = ?').bind(name, location, id), ...ownerOps]);
      return json({ id, name, location, owner: (await shopAccounts(db, id)).owner });
    }
    // حذف آرایشگاه (فقط مدیر سایت)
    if (method === 'DELETE') {
      requireAuth(auth);
      if (auth.r !== 'super') throw new HttpError(403, 'فقط مدیر سایت می‌تواند آرایشگاه را حذف کند');
      const res = await db.prepare('DELETE FROM shops WHERE id = ?').bind(id).run();
      if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
      await db.prepare('DELETE FROM accounts WHERE shop_id = ?').bind(id).run();
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
        return json({ ...cur, role: 'barber', barberId: auth.b });
      }
      return json({ ...cur, role: auth.r, accounts: await shopAccounts(db, id) });
    }

    if (method === 'PUT') {
      const { data, version } = await readJson(request);
      if (!data || !Array.isArray(data.barbers) || !Array.isArray(data.appointments) || !Number.isInteger(version)) {
        throw new HttpError(400, 'درخواست نامعتبر است');
      }
      if (version !== cur.version) throw new HttpError(409, 'داده‌ها هم‌زمان از دستگاه دیگری تغییر کرده است');
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

  // نام کاربری و رمز آرایشگر (مالک یا مدیر سایت)
  if (id && parts[3] === 'accounts' && parts[4] && parts.length === 5) {
    requireShop(auth, id, ['owner']);
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
        if (err instanceof HttpError) return json({ error: err.message }, err.status);
        return json({ error: 'خطای سرور: ' + (err && err.message) }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
