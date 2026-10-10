// API سایت نوبت‌دهی روی Cloudflare Workers با دیتابیس D1.
// فایل‌های سایت (پوشهٔ public) را خود Cloudflare سرو می‌کند و فقط مسیرهای /api به این کد می‌رسند.
// کل داده‌ها یک سند JSON در جدول store است و ستون version جلوی بازنویسی هم‌زمان را می‌گیرد.

const EMPTY = { settings: { shopName: 'آرایشگاه من' }, barbers: [], appointments: [] };
const MAX_BODY = 1024 * 1024;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const toEn = (v) =>
  String(v || '')
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632)
    .trim();

let ready = null;
function init(db) {
  ready ??= db
    .prepare('CREATE TABLE IF NOT EXISTS store (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, version INTEGER NOT NULL)')
    .run()
    .catch((err) => { ready = null; throw err; });
  return ready;
}

async function load(db) {
  const row = await db.prepare('SELECT data, version FROM store WHERE id = 1').first();
  return row ? { data: JSON.parse(row.data), version: row.version } : { data: EMPTY, version: 0 };
}

async function save(db, data, version) {
  const text = JSON.stringify(data);
  const res = version === 0
    ? await db.prepare('INSERT INTO store (id, data, version) VALUES (1, ?, 1) ON CONFLICT(id) DO NOTHING').bind(text).run()
    : await db.prepare('UPDATE store SET data = ?, version = version + 1 WHERE id = 1 AND version = ?').bind(text, version).run();
  return res.meta.changes === 1 ? version + 1 : null;
}

function isAdmin(request, env) {
  return toEn(request.headers.get('x-admin-password')) === toEn(env.ADMIN_PASSWORD || '1234');
}

// نمای مشتری فقط بازه‌های پر را می‌گیرد، نه نام و شمارهٔ مشتری‌ها
function publicView(data) {
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return {
    settings: data.settings,
    barbers: data.barbers,
    busy: (data.appointments || [])
      .filter((a) => a.date >= yesterday)
      .map((a) => ({ barberId: a.barberId, date: a.date, start: a.start, end: a.end })),
  };
}

async function handleApi(request, env, path) {
  if (!env.DB) return json({ error: 'دیتابیس به Worker متصل نشده است (binding با نام DB)' }, 500);
  await init(env.DB);

  if (path === '/api/public' && request.method === 'GET') {
    return json(publicView((await load(env.DB)).data));
  }

  if (path === '/api/login' && request.method === 'POST') {
    return isAdmin(request, env) ? json({ ok: true }) : json({ error: 'رمز عبور اشتباه است' }, 401);
  }

  if (path === '/api/admin/data') {
    if (!isAdmin(request, env)) return json({ error: 'ابتدا وارد پنل مدیریت شوید' }, 401);

    if (request.method === 'GET') return json(await load(env.DB));

    if (request.method === 'PUT') {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return json({ error: 'حجم داده بیش از حد مجاز است' }, 413);
      let body;
      try { body = JSON.parse(raw); } catch { return json({ error: 'درخواست نامعتبر است' }, 400); }
      const { data, version } = body || {};
      if (!data || !Array.isArray(data.barbers) || !Array.isArray(data.appointments) || !Number.isInteger(version)) {
        return json({ error: 'درخواست نامعتبر است' }, 400);
      }
      const next = await save(env.DB, data, version);
      if (next === null) return json({ error: 'داده‌ها هم‌زمان از دستگاه دیگری تغییر کرده است' }, 409);
      return json({ version: next });
    }
  }

  return json({ error: 'مسیر پیدا نشد' }, 404);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      try {
        return await handleApi(request, env, path);
      } catch (err) {
        return json({ error: 'خطای سرور: ' + (err && err.message) }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};
