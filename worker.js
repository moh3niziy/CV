// API سایت نوبت‌دهی روی Cloudflare Workers با دیتابیس D1.
// فایل‌های سایت (پوشهٔ public) را خود Cloudflare سرو می‌کند و فقط مسیرهای /api به این کد می‌رسند.
// هر آرایشگاه یک ردیف در جدول shops است؛ داده‌های آن (آرایشگرها و نوبت‌ها) یک سند JSON است
// و ستون version جلوی بازنویسی هم‌زمان را می‌گیرد.

const EMPTY = { barbers: [], appointments: [] };
const MAX_BODY = 1024 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const toEn = (v) =>
  String(v || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
    .trim();

let ready = null;
function init(db) {
  ready ??= migrate(db).catch((err) => { ready = null; throw err; });
  return ready;
}

async function migrate(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, location TEXT NOT NULL,
    data TEXT NOT NULL, version INTEGER NOT NULL, created_at INTEGER NOT NULL)`).run();
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

function newId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
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

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new HttpError(413, 'حجم داده بیش از حد مجاز است');
  try { return JSON.parse(raw || '{}'); } catch { throw new HttpError(400, 'درخواست نامعتبر است'); }
}

function isAdmin(request, env) {
  return toEn(request.headers.get('x-admin-password')) === toEn(env.ADMIN_PASSWORD || '1234');
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

async function handleApi(request, env, path) {
  if (!env.DB) throw new HttpError(500, 'دیتابیس به Worker متصل نشده است (binding با نام DB)');
  const db = env.DB;
  await init(db);
  const method = request.method;
  const parts = path.split('/').filter(Boolean).slice(1); // بدون «api»

  if (method === 'POST' && path === '/api/login') {
    if (!isAdmin(request, env)) throw new HttpError(401, 'رمز عبور اشتباه است');
    return json({ ok: true });
  }

  // ---- عمومی
  if (method === 'GET' && parts[0] === 'shops') {
    if (parts.length === 1) {
      const { results } = await db.prepare(`SELECT id, name, location,
        COALESCE(json_array_length(data, '$.barbers'), 0) AS barbers
        FROM shops ORDER BY created_at`).all();
      return json({ shops: results });
    }
    if (parts.length === 2) return json(publicView(await getShop(db, parts[1])));
  }

  // ---- مدیریت
  if (parts[0] !== 'admin') throw new HttpError(404, 'مسیر پیدا نشد');
  if (!isAdmin(request, env)) throw new HttpError(401, 'ابتدا وارد پنل مدیریت شوید');
  if (parts[1] !== 'shops') throw new HttpError(404, 'مسیر پیدا نشد');
  const id = parts[2];

  if (method === 'POST' && !id) {
    const { name, location } = cleanShop(await readJson(request));
    const shop = { id: newId(), name, location };
    await db.prepare('INSERT INTO shops (id, name, location, data, version, created_at) VALUES (?, ?, ?, ?, 1, ?)')
      .bind(shop.id, name, location, JSON.stringify(EMPTY), Date.now()).run();
    return json(shop);
  }

  if (id && parts.length === 3) {
    if (method === 'PUT') {
      const { name, location } = cleanShop(await readJson(request));
      const res = await db.prepare('UPDATE shops SET name = ?, location = ? WHERE id = ?').bind(name, location, id).run();
      if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
      return json({ id, name, location });
    }
    if (method === 'DELETE') {
      const res = await db.prepare('DELETE FROM shops WHERE id = ?').bind(id).run();
      if (!res.meta.changes) throw new HttpError(404, 'آرایشگاه پیدا نشد');
      return json({ id });
    }
  }

  if (id && parts[3] === 'data' && parts.length === 4) {
    if (method === 'GET') return json(await getShop(db, id));
    if (method === 'PUT') {
      const { data, version } = await readJson(request);
      if (!data || !Array.isArray(data.barbers) || !Array.isArray(data.appointments) || !Number.isInteger(version)) {
        throw new HttpError(400, 'درخواست نامعتبر است');
      }
      const res = await db.prepare('UPDATE shops SET data = ?, version = version + 1 WHERE id = ? AND version = ?')
        .bind(JSON.stringify({ barbers: data.barbers, appointments: data.appointments }), id, version).run();
      if (!res.meta.changes) {
        await getShop(db, id); // اگر آرایشگاه حذف شده باشد ۴۰۴ برمی‌گرداند
        throw new HttpError(409, 'داده‌ها هم‌زمان از دستگاه دیگری تغییر کرده است');
      }
      return json({ version: version + 1 });
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
