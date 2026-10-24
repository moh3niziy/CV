// تست دود worker.js روی D1 تقلبی (test/mock-d1.mjs) — بدون Cloudflare و بدون شبکه.
// اجرا: node test/smoke.mjs   (خروجی صفر یعنی همه سناریوها پاس شده‌اند)
//
// همهٔ سناریوها روی یک دیتابیس اجرا می‌شود: ready و secret در worker سطح ماژول‌اند،
// پس migrate فقط برای اولین دیتابیس اجرا می‌شود و ساختن MockD1 جدید جدول‌ها را نمی‌سازد.
// شمارهٔ version قبل از هر نوشتن از خود دیتابیس خوانده می‌شود تا درخواست‌های رد شده
// (۴۰۰/۴۰۳) انتظارات کنترل هم‌زمانی را از هم نیندازد.

import { MockD1 } from './mock-d1.mjs';

const worker = (await import('../worker.js')).default;

const SUPER_USER = 'moh3n';
const SUPER_PASS = 'test-super-pass';

let pass = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` → ${JSON.stringify(detail)}`}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/* ---------------------------------------------------------------- clock */
// تاریخ و دقیقهٔ فعلی Tehran، مستقل از منطقهٔ زمانی دستگاه (همان مرجع سرور)
function tehranNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
const tehranDate = () => tehranNow().date;
const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, '0');
// ساعتی که مطمئنیم امروز و در آیندهٔ تهران است
function futureTime(minutesFromNow = 90) {
  const m = Math.min(1439, tehranNow().min + minutesFromNow);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/* ---------------------------------------------------------------- env */
let db = new MockD1();

// جای Cloudflare Static Assets: هر مسیر غیر از /api یک پاسخ HTML ساده برمی‌گرداند
const ASSETS = {
  fetch: (request) => Promise.resolve(new Response('<!doctype html><title>shell</title>', {
    status: 200, headers: { 'content-type': 'text/html; charset=utf-8' },
  })),
};

function call(method, path, { body, token, headers = {} } = {}) {
  const url = new URL(path, 'https://hairdresser.test');
  const h = new Headers({ 'content-type': 'application/json', ...headers });
  if (token) h.set('authorization', 'Bearer ' + token);
  const request = new Request(url, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  return worker.fetch(request, { DB: db, ASSETS, ADMIN_USERNAME: SUPER_USER, ADMIN_PASSWORD: SUPER_PASS });
}

async function api(method, path, opts) {
  const res = await call(method, path, opts);
  let json = null;
  try { json = await res.clone().json(); } catch { /* پاسخ بدنهٔ JSON ندارد */ }
  return { status: res.status, json, res };
}

// شمارهٔ version فعلی، مستقیم از دیتابیس — تا نوشتن‌های رد شده (۴۰۰/۴۰۳)
// انتظارات کنترل هم‌زمانی را از واقعیت دور نکنند.
const curVersion = (id) => db.prepare('SELECT version FROM shops WHERE id = ?').bind(id).first().version;

// درج نوبت قدیمی مستقیم در دیتابیس، برای شبیه‌سازی نوبتی که موقع ثبت آینده بوده و حالا گذشته است
function seedAppointment(id, appt) {
  const row = db.prepare('SELECT data FROM shops WHERE id = ?').bind(id).first();
  const data = JSON.parse(row.data);
  data.appointments = [...data.appointments.filter((a) => a.id !== appt.id), appt];
  db.prepare('UPDATE shops SET data = ?, version = version + 1 WHERE id = ?').bind(JSON.stringify(data), id).run();
}

/* ---------------------------------------------------------------- دادهٔ نمونه */
const BARBER = {
  id: 'b1', name: 'استاد رضا', phone: '09121234567',
  hours: Object.fromEntries([...Array(7)].map((_, i) => [String(i), { on: true, start: '09:00', end: '23:00' }])),
  services: [{ id: 's1', name: 'اصلاح مو', minutes: 30 }],
};
const appointment = (id, start) => ({
  id, barberId: 'b1', date: tehranDate(), start, end: addMin(start, 30),
  customerName: 'علی', customerPhone: '091299999999',
  services: [{ id: 's1', name: 'اصلاح مو', minutes: 30 }],
  createdAt: Date.now(),
});
function addMin(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const t = Math.min(1439, h * 60 + m + minutes);
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

/* ================================================================ 1. super login */
section('ورود مدیر سایت');
const badLogin = await api('POST', '/api/login', { body: { username: SUPER_USER, password: 'wrong' } });
check('رمز اشتباه → 401', badLogin.status === 401, badLogin.json);
const noSecret = await new Promise(async (resolve) => {
  const res = await worker.fetch(new Request('https://hairdresser.test/api/login', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"username":"moh3n","password":"x"}',
  }), { DB: db });
  resolve(res.status);
});
check('بدون Secret → 503', noSecret === 503, noSecret);
const superLogin = await api('POST', '/api/login', { body: { username: 'Moh3n', password: SUPER_PASS } });
const superToken = superLogin.json?.token;
check('رمز درست → 200 و توکن super', superLogin.status === 200 && superLogin.json.role === 'super' && !!superToken, superLogin.json);
check('نام کاربری case-insensitive است', superLogin.json?.name?.toLowerCase() === 'moh3n', superLogin.json);

/* ================================================================ 2. ساخت آرایشگاه */
section('ساخت آرایشگاه (super)');
const created = await api('POST', '/api/admin/shops', {
  token: superToken,
  body: {
    name: 'آرایشگاه تست', location: 'تهران، خیابان تست',
    instagram: 'https://instagram.com/test.shop', telegram: '@testshop',
    ownerUsername: 'owner_one', ownerPassword: 'pass1234',
    ownerName: 'رضا محمدی', ownerPhone: '۰۹۱۲۰۰۰۰۰۰۰',
  },
});
check('ساخت → 200 با id', created.status === 200 && !!created.json.id, created.json);
check('اشتراک ۳۰ روز (رفتار فعلی FREE_DAYS)', created.json?.expiresAt === addDays(tehranDate(), 30), created.json);
check('اینستاگرام از لینک تمیز شد', created.json?.instagram === 'test.shop', created.json);
check('تلفن مالک با ارقام فارسی نرمال شد', created.json?.ownerPhone === '09120000000', created.json);

const dupUser = await api('POST', '/api/admin/shops', {
  token: superToken,
  body: { name: 'دوم', location: 'شهر', ownerUsername: 'owner_one', ownerPassword: 'pass1234' },
});
check('ساخت آرایشگاه دوم موفق (نام کاربری در هر shop جداست)', dupUser.status === 200, dupUser.json);
const otherId = dupUser.json?.id;

const noName = await api('POST', '/api/admin/shops', { token: superToken, body: { location: 'x', ownerUsername: 'u2', ownerPassword: 'pass1234' } });
check('بدون نام → 400', noName.status === 400, noName.json);
const anonCreate = await api('POST', '/api/admin/shops', { body: { name: 'n', location: 'l', ownerUsername: 'u3', ownerPassword: 'pass1234' } });
check('ساخت بدون توکن → 401', anonCreate.status === 401, anonCreate.json);

/* ================================================================ 3. ورود مالک و آرایشگر */
section('ورود مالک و آرایشگر');
const shopId = created.json.id;

const ownerLogin = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'owner_one', password: 'pass1234' } });
const ownerToken = ownerLogin.json?.token;
check('ورود مالک → 200 و نقش owner', ownerLogin.status === 200 && ownerLogin.json.role === 'owner', ownerLogin.json);
check('نام نمایشی مالک شامل نام آرایشگاه است', /مالک/.test(ownerLogin.json?.name || ''), ownerLogin.json);

const superOnShop = await api('POST', `/api/shops/${shopId}/login`, { body: { username: SUPER_USER, password: SUPER_PASS } });
check('ورود با اطلاعات super در صفحهٔ آرایشگاه', superOnShop.status === 200 && superOnShop.json.role === 'super', superOnShop.json);

const badShopLogin = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'owner_one', password: 'nope' } });
check('رمز اشتباه در ورود آرایشگاه → 401', badShopLogin.status === 401, badShopLogin.json);

// آرایشگر: حساب ساخته و نوبت ثبت می‌شود، بعد از آن فقط نوبت خودش را می‌بیند
const accPut = await api('PUT', `/api/admin/shops/${shopId}/accounts/b1`, { token: ownerToken, body: { username: 'barber_one', password: 'bbbb1234' } });
check('ساخت حساب آرایشگر → 200', accPut.status === 200 && accPut.json.barberId === 'b1', accPut.json);

const save1 = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken, body: { data: { barbers: [BARBER], appointments: [appointment('a1', futureTime())] }, version: await curVersion(shopId) },
});
check('ذخیرهٔ دادهٔ مالک → 200 با version بعدی', save1.status === 200 && save1.json.version === 2, save1.json);

const barberLogin = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'barber_one', password: 'bbbb1234' } });
const barberToken = barberLogin.json?.token;
check('ورود آرایشگر → نقش barber با barberId', barberLogin.json?.role === 'barber' && barberLogin.json?.barberId === 'b1', barberLogin.json);

const barberGet = await api('GET', `/api/admin/shops/${shopId}/data`, { token: barberToken });
check('آرایشگر فقط پروفایل خودش را می‌بیند', barberGet.json?.data?.barbers?.length === 1 && barberGet.json.data.barbers[0].id === 'b1', barberGet.json?.data?.barbers);

// آرایشگر دوم برای سنجش نقض دسترسی
const saveTwo = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken,
  body: {
    data: {
      barbers: [BARBER, { ...BARBER, id: 'b2', name: 'آرایشگر دوم' }],
      appointments: [appointment('a1', futureTime()), appointment('a2', futureTime(180))],
    },
    version: await curVersion(shopId),
  },
});
check('ثبت دو نوبت برای دو آرایشگر', saveTwo.status === 200 && saveTwo.json.version === 3, saveTwo.json);
const barberGetTwo = await api('GET', `/api/admin/shops/${shopId}/data`, { token: barberToken });
check('آرایشگر نوبت دیگری را نمی‌بیند', (barberGetTwo.json?.data?.appointments || []).every((a) => a.barberId === 'b1'), barberGetTwo.json?.data?.appointments);

// آرایشگر سعی می‌کند آرایشگرها و نوبت‌های دیگران را عوض کند
const barberWrite = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: barberToken,
  body: {
    data: {
      barbers: [{ ...BARBER, name: 'نام دلخواه آرایشگر' }, { ...BARBER, id: 'b2', name: 'حذف‌شده' }],
      appointments: [],
    },
    version: await curVersion(shopId),
  },
});
check('نوشتن آرایشگر → 200 (سرور تغییرات دیگران را نادیده می‌گیرد)', barberWrite.status === 200, barberWrite.json);
const afterBarber = await api('GET', `/api/admin/shops/${shopId}/data`, { token: ownerToken });
check('لیست آرایشگرها دست‌نخورده ماند', (afterBarber.json?.data?.barbers || []).length === 2, afterBarber.json?.data?.barbers);
check('نام آرایشگر توسط او تغییر نکرد', afterBarber.json?.data?.barbers?.find((b) => b.id === 'b1')?.name === BARBER.name);
check('نوبت‌های خودش حذف شد و نوبت دیگران ماند', (afterBarber.json?.data?.appointments || []).every((a) => a.barberId === 'b2'), afterBarber.json?.data?.appointments);

const barberAccountDelete = await api('DELETE', `/api/admin/shops/${shopId}/accounts/b2`, { token: barberToken });
check('آرایشگر نمی‌تواند حساب آرایشگر دیگر را حذف کند', barberAccountDelete.status === 403, barberAccountDelete.json);

const dupUsername = await api('PUT', `/api/admin/shops/${shopId}/accounts/b2`, { token: ownerToken, body: { username: 'barber_one', password: 'zzzz1234' } });
check('نام کاربری تکراری در همان آرایشگاه → 409', dupUsername.status === 409, dupUsername.json);
const badUsername = await api('PUT', `/api/admin/shops/${shopId}/accounts/b2`, { token: ownerToken, body: { username: 'علی', password: 'zzzz1234' } });
check('نام کاربری فارسی → 400', badUsername.status === 400, badUsername.json);
const shortPass = await api('PUT', `/api/admin/shops/${shopId}/accounts/b2`, { token: ownerToken, body: { username: 'ok_user', password: '123' } });
check('رمز کوتاه → 400', shortPass.status === 400, shortPass.json);

/* ================================================================ 4. قواعد زمان */
section('جلوگیری از ثبت نوبت در گذشته');
const pastDate = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken,
  body: { data: { barbers: [BARBER], appointments: [{ ...appointment('a9', '09:30'), date: addDays(tehranDate(), -2) }] }, version: await curVersion(shopId) },
});
check('نوبت در روز گذشته → 400', pastDate.status === 400, pastDate.json);
const pastHour = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken,
  body: { data: { barbers: [BARBER], appointments: [{ ...appointment('a10', '00:05'), date: tehranDate() }] }, version: await curVersion(shopId) },
});
check('نوبت در ساعت گذشته امروز → 400', pastHour.status === 400, pastHour.json);

// نوبتی که قبلاً در آینده ثبت شده و حالا گذشته است، مستقیم در دیتابیس کاشته می‌شود
seedAppointment(shopId, { ...appointment('old1', '09:00'), date: addDays(tehranDate(), -5) });
const renamePast = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken,
  body: {
    data: {
      barbers: [BARBER],
      appointments: [{ ...appointment('old1', '09:00'), date: addDays(tehranDate(), -5), customerName: 'نام تازه' }],
    },
    version: await curVersion(shopId),
  },
});
check('ویرایش نوبت گذشته (بدون جابه‌جایی زمان) مجاز است', renamePast.status === 200, renamePast.json);
const movePast = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken,
  body: {
    data: {
      barbers: [BARBER],
      appointments: [{ ...appointment('old1', '08:00'), date: addDays(tehranDate(), -5) }],
    },
    version: await curVersion(shopId),
  },
});
check('جابه‌جایی نوبت گذشته مجاز نیست → 400', movePast.status === 400, movePast.json);

/* ================================================================ 5. هم‌زمانی (version) */
section('کنترل هم‌زمانی');
const badVersion = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken, body: { data: { barbers: [BARBER], appointments: [] }, version: 99 },
});
check('version اشتباه → 409', badVersion.status === 409, badVersion.json);
const noVersion = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken, body: { data: { barbers: [BARBER], appointments: [] } },
});
check('بدون version → 400', noVersion.status === 400, noVersion.json);

/* ================================================================ 6. نمای مشتری */
section('نمای مشتری (GET /api/shops/:id)');
const pub = await api('GET', `/api/shops/${shopId}`);
check('نمای مشتری → 200', pub.status === 200, pub.json);
const raw = JSON.stringify(pub.json);
check('نام مشتری‌ها به مشتری نشان داده نمی‌شود', !raw.includes('علی'), undefined);
check('شمارهٔ مشتری‌ها حذف شده است', !raw.includes('091299999999'));
check('فقط بازهٔ پر ارسال می‌شود (busy)', Array.isArray(pub.json?.busy), pub.json);
check('وضعیت اشتراک فیلتر شده است', !('sub' in (pub.json?.shop || {})), pub.json?.shop);
check('ساعت کاری و خدمات آرایشگر برای مشتری می‌ماند', pub.json?.barbers?.[0]?.hours && pub.json?.barbers?.[0]?.services, pub.json?.barbers);
const phoneInBusy = (pub.json?.busy || []).some((b) => b.customerName || b.customerPhone);
check('در busy هیچ فیلد مشتری نیست', !phoneInBusy, pub.json?.busy);

const list = await api('GET', '/api/shops');
check('لیست عمومی آرایشگاه‌ها → 200', list.status === 200 && Array.isArray(list.json?.shops));
check('تلفن مالک در لیست عمومی نیست', !JSON.stringify(list.json).includes('09120000000'));
const superList = await api('GET', '/api/shops', { token: superToken });
check('لیست برای super شامل sub است', !!superList.json?.shops?.[0]?.sub, superList.json?.shops?.[0]);

/* ================================================================ 7. غیرفعال‌سازی */
section('غیرفعال‌سازی آرایشگاه');
const offByOwner = await api('PUT', `/api/admin/shops/${shopId}/status`, { token: ownerToken, body: { active: false } });
check('مالک نمی‌تواند خودش را غیرفعال کند → 403', offByOwner.status === 403, offByOwner.json);
const off = await api('PUT', `/api/admin/shops/${shopId}/status`, { token: superToken, body: { active: false } });
check('super غیرفعال کرد → 200', off.status === 200 && off.json.active === false, off.json);
const pubOff = await api('GET', `/api/shops/${shopId}`);
check('صفحهٔ مشتری آرایشگاه غیرفعال → 403', pubOff.status === 403, pubOff.json);
const pubOffSuper = await api('GET', `/api/shops/${shopId}`, { token: superToken });
check('super صفحهٔ غیرفعال را می‌بیند', pubOffSuper.status === 200, pubOffSuper.status);
const loginOff = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'owner_one', password: 'pass1234' } });
check('ورود مالک آرایشگاه غیرفعال → 403', loginOff.status === 403, loginOff.json);
const newApptOff = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: superToken,
  body: { data: { barbers: [BARBER], appointments: [appointment('fresh1', futureTime())] }, version: await curVersion(shopId) },
});
check('آرایشگاه غیرفعال نوبت جدید نمی‌پذیرد (حتی super) → 403', newApptOff.status === 403, newApptOff.json);
const editOff = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: superToken, body: { data: { barbers: [BARBER], appointments: [] }, version: await curVersion(shopId) },
});
check('ویرایش/حذف نوبت‌های قبلی در آرایشگاه غیرفعال مجاز است', editOff.status === 200, editOff.json);
await api('PUT', `/api/admin/shops/${shopId}/status`, { token: superToken, body: { active: true } });

/* ================================================================ 8. چرخهٔ اشتراک */
section('هشدار / مهلت / انقضا');
const warn = await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: superToken, body: { expiresAt: addDays(tehranDate(), 3) } });
check('۳ روز مانده → warning', warn.json?.sub?.state === 'warning' && warn.json.sub.daysLeft === 3, warn.json);
const badDate = await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: superToken, body: { expiresAt: '1405/07/01' } });
check('تاریخ نامعتبر → 400', badDate.status === 400, badDate.json);
const subByOwner = await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: ownerToken, body: { expiresAt: addDays(tehranDate(), 30) } });
check('مالک نمی‌تواند اشتراک خودش را تغییر دهد → 403', subByOwner.status === 403, subByOwner.json);

await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: superToken, body: { expiresAt: addDays(tehranDate(), -3) } });
const gracePub = await api('GET', `/api/shops/${shopId}`);
check('در مهلت (grace) صفحهٔ مشتری کار می‌کند', gracePub.status === 200, gracePub.status);
const graceOwnerWrite = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: ownerToken, body: { data: { barbers: [BARBER], appointments: [] }, version: await curVersion(shopId) },
});
check('مالک در grace نوشتن نمی‌تواند → 403 readonly', graceOwnerWrite.status === 403 && graceOwnerWrite.json?.readonly === true, graceOwnerWrite.json);
const graceSuperWrite = await api('PUT', `/api/admin/shops/${shopId}/data`, {
  token: superToken, body: { data: { barbers: [BARBER], appointments: [] }, version: await curVersion(shopId) },
});
check('super در grace می‌تواند بنویسد', graceSuperWrite.status === 200, graceSuperWrite.json);

await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: superToken, body: { expiresAt: addDays(tehranDate(), -10) } });
const expPub = await api('GET', `/api/shops/${shopId}`);
check('آرایشگاه منقضی: صفحهٔ مشتری 403 با expired:true', expPub.status === 403 && expPub.json?.expired === true, expPub.json);
check('پیام انقضا راهٔ تماس دارد', !!expPub.json?.support?.telegram, expPub.json?.support);
const expList = await api('GET', '/api/shops');
check('آرایشگاه منقضی از لیست عمومی پنهان است', !(expList.json?.shops || []).some((s) => s.id === shopId));
const expBarberLogin = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'barber_one', password: 'bbbb1234' } });
check('آرایشگر آرایشگاه منقضی نمی‌تواند وارد شود', expBarberLogin.status === 403, expBarberLogin.json);
const expOwnerLogin = await api('POST', `/api/shops/${shopId}/login`, { body: { username: 'owner_one', password: 'pass1234' } });
const expOwnerToken = expOwnerLogin.json?.token;
check('مالک آرایشگاه منقضی برای تمدید وارد می‌شود', expOwnerLogin.status === 200 && expOwnerLogin.json.role === 'owner', expOwnerLogin.json);
const expPanel = await api('GET', `/api/admin/shops/${shopId}/data`, { token: expOwnerToken });
check('مالک منقضی پنل را فقط‌مشاهدتی می‌خواند', expPanel.status === 200, expPanel.status);
const expEdit = await api('PUT', `/api/admin/shops/${shopId}`, { token: expOwnerToken, body: { name: 'تغییر نام', location: 'ل' } });
check('ویرایش اطلاعات آرایشگاه توسط مالک منقضی مسدود است', expEdit.status === 403, expEdit.json);

/* ================================================================ 9. رسید تمدید */
section('رسید تمدید از پنل مالک');
const RECEIPT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const renewBadPlan = await api('POST', `/api/admin/shops/${shopId}/renewal`, { token: expOwnerToken, body: { plan: 12, image: RECEIPT } });
check('پلن نامعتبر → 400', renewBadPlan.status === 400, renewBadPlan.json);
const renewBadImage = await api('POST', `/api/admin/shops/${shopId}/renewal`, { token: expOwnerToken, body: { plan: 3, image: 'data:text/plain;base64,AAA' } });
check('تصویر نامعتبر → 400', renewBadImage.status === 400, renewBadImage.json);
const renew = await api('POST', `/api/admin/shops/${shopId}/renewal`, { token: expOwnerToken, body: { plan: 3, image: RECEIPT } });
check('ارسال رسید تمدید → 200 و در انتظار بررسی', renew.status === 200 && renew.json?.renewal?.plan === 3, renew.json);
const renewedByBarber = await api('POST', `/api/admin/shops/${shopId}/renewal`, { token: barberToken, body: { plan: 3, image: RECEIPT } });
check('آرایشگر نمی‌تواند رسید تمدید بفرستد', renewedByBarber.status === 403, renewedByBarber.json);

const renewals = await api('GET', '/api/admin/renewals', { token: superToken });
const myRenewal = (renewals.json?.renewals || []).find((r) => r.shopId === shopId);
check('super رسید را در لیست تمدیدها می‌بیند', !!myRenewal && myRenewal.status === 'new', renewals.json?.renewals);
check('رسید تمدید شامل مبلغ پلن است', myRenewal?.amount === 2000000, myRenewal);
const receiptImage = await api('GET', `/api/admin/receipts/${myRenewal.id}`, { token: superToken });
check('super تصویر رسید را می‌خواند', receiptImage.json?.image === RECEIPT, receiptImage.status);
const receiptAnon = await api('GET', `/api/admin/receipts/${myRenewal.id}`);
check('تصویر رسید بدون توکن → 401', receiptAnon.status === 401, receiptAnon.json);

const beforeExpires = addDays(tehranDate(), -10);
const approve = await api('PUT', `/api/admin/renewals/${myRenewal.id}`, { token: superToken, body: { action: 'approve' } });
check('تأیید → 200 و وضعیت done', approve.status === 200 && approve.json?.status === 'done', approve.json);
check('اشتراک منقضی از امروز تمدید می‌شود (۳×۳۰ روز)',
  approve.json?.sub?.expiresAt === addDays(tehranDate(), 90) && beforeExpires < tehranDate(), approve.json);

// اشتراک فعال: تمدید از پایان فعلی حساب می‌شود، نه از امروز
await api('PUT', `/api/admin/shops/${shopId}/subscription`, { token: superToken, body: { expiresAt: addDays(tehranDate(), 5) } });
const renewActive = await api('POST', `/api/admin/shops/${shopId}/renewal`, { token: expOwnerToken, body: { plan: 1, image: RECEIPT } });
check('مالک در اشتراک فعال هم می‌تواند رسید بفرستد', renewActive.status === 200, renewActive.json);
const renewals2 = await api('GET', '/api/admin/renewals', { token: superToken });
const pending = (renewals2.json?.renewals || []).filter((r) => r.shopId === shopId && r.status === 'new');
const approve2 = await api('PUT', `/api/admin/renewals/${pending[0].id}`, { token: superToken, body: { action: 'approve' } });
check('تمدید اشتراک فعال از تاریخ پایان قبلی ادامه می‌یابد (۵ + ۳۰ روز)',
  approve2.json?.sub?.expiresAt === addDays(tehranDate(), 35), approve2.json);
const reApprove = await api('PUT', `/api/admin/renewals/${myRenewal.id}`, { token: superToken, body: { action: 'approve' } });
check('تأیید دوبارهٔ همان رسید → 409', reApprove.status === 409, reApprove.json);
const afterApprove = await api('GET', `/api/shops/${shopId}`);
check('بعد از تأیید، صفحهٔ مشتری دوباره باز می‌شود', afterApprove.status === 200, afterApprove.status);

/* ================================================================ 10. تعرفه‌ها */
section('تعرفه‌های پویا');
const plans = await api('GET', '/api/plans');
check('GET /api/plans → سه پلن پیش‌فرض', plans.json?.plans?.length === 3 && plans.json.plans[0].price === 1000000, plans.json);
const plansByOwner = await api('PUT', '/api/admin/plans', { token: ownerToken, body: { plans: [{ months: 1, price: 500000 }] } });
check('مالک نمی‌تواند تعرفه را عوض کند → 403', plansByOwner.status === 403, plansByOwner.json);
const newPlans = await api('PUT', '/api/admin/plans', {
  token: superToken,
  body: { plans: [
    { months: 1, price: 500000 },
    { months: 3, price: 1200000, compare: 1500000 },
    { months: 6, price: 2000000, compare: 3000000 },
  ] },
});
check('super تعرفه‌ها را عوض کرد (با ارقام فارسی)', newPlans.status === 200 && newPlans.json?.plans?.[0]?.price === 500000, newPlans.json);
const afterPlans = await api('GET', '/api/plans');
check('پلن یک‌ماهه بدون تخفیف می‌ماند', afterPlans.json?.plans?.[0]?.compare === 0, afterPlans.json);
const badPlans = await api('PUT', '/api/admin/plans', { token: superToken, body: { plans: [{ months: 1, price: 100 }, { months: 3, price: 1 }, { months: 6, price: 1 }] } });
check('قیمت زیر حداقل → 400', badPlans.status === 400, badPlans.json);
const badCompare = await api('PUT', '/api/admin/plans', {
  token: superToken,
  body: { plans: [{ months: 1, price: 500000, compare: 400000 }, { months: 3, price: 1200000 }, { months: 6, price: 2000000 }] },
});
check('قیمت قبل از تخفیف کمتر از قیمت → 400', badCompare.status === 400, badCompare.json);
const missingPlan = await api('PUT', '/api/admin/plans', { token: superToken, body: { plans: [{ months: 1, price: 500000 }] } });
check(' نبودن همهٔ پلن‌ها → 400', missingPlan.status === 400, missingPlan.json);

/* ================================================================ 11. سفارش ساخت سایت */
section('lead: سفارش، پرداخت، رسید');
// تعرفهٔ روز (در بخش ۱۰ عوض شده) تا انتظارات به ترتیب اجرا وابسته نباشند
const priceOf = async (months) => (await api('GET', '/api/plans')).json?.plans?.find((p) => p.months === months)?.price;
const plan6 = await priceOf(6);
const plan1 = await priceOf(1);
const order = await api('POST', '/api/leads', {
  body: { name: 'مشتری تست', shopName: 'آرایشگاه جدید', phone: '۹۱۲۱۱۱۲۲۳۳', city: 'ساری', note: 'سه آرایشگر', plan: 6, source: 'zzzzzzzzzz' },
});
check('ثبت سفارش → 200 با توکن', order.status === 200 && !!order.json?.token, order.json);
check('شماره به شکل 09xxxxxxxxx نرمال شد', order.json?.order?.phone === '09121112233', order.json?.order);
check('مبلغ از تعرفهٔ روزِ پلن حساب شد', order.json?.order?.amount === plan6, order.json?.order);
check('اطلاعات داخلی (ip) به کاربر برنمی‌گردد', !('ip' in (order.json?.order || {})), order.json?.order);

const noPhone = await api('POST', '/api/leads', { body: { name: 'x y', shopName: 'shop', phone: '12345', plan: 1 } });
check('شمارهٔ نامعتبر → 400', noPhone.status === 400, noPhone.json);
const noPlan = await api('POST', '/api/leads', { body: { name: 'x y', shopName: 'shop', phone: '09121112234', plan: 0 } });
check('بدون پلن → 400', noPlan.status === 400, noPlan.json);
const honeypot = await api('POST', '/api/leads', { body: { name: 'r', phone: '09121112235', plan: 1, website: 'spam' } });
check('فیلد ضدربات → 200 بی‌خطر', honeypot.status === 200 && honeypot.json?.ok === true, honeypot.json);

const leadToken = order.json.token;
const me = await api('GET', '/api/leads/me', { headers: { 'x-lead-token': leadToken } });
check('خواندن سفارش با توکن → 200', me.status === 200 && me.json?.order?.status === 'new', me.json);
const meAnon = await api('GET', '/api/leads/me');
check('بدون توکن → 404', meAnon.status === 404, meAnon.json);

const again = await api('POST', '/api/leads', { body: { name: 'مشتری تست', shopName: 'آرایشگاه جدید', phone: '09121112233', plan: 1 } });
check('همان شماره → همان سفارش (تکراری ساخته نمی‌شود)', again.json?.order?.id === me.json.order.id, again.json?.order);
check('پلن اصلاح‌شده مبلغ را هم عوض کرد', again.json?.order?.plan === 1 && again.json?.order?.amount === plan1, again.json?.order);

const changePlan = await api('PUT', '/api/leads/me', { token: undefined, headers: { 'x-lead-token': leadToken }, body: { plan: 3 } });
check('تغییر پلن سفارش → 200', changePlan.status === 200 && changePlan.json?.order?.plan === 3, changePlan.json);
const sendReceipt = await api('POST', '/api/leads/me/receipt', { headers: { 'x-lead-token': leadToken }, body: { image: RECEIPT } });
check('ارسال رسید سفارش → 200 و وضعیت paid', sendReceipt.status === 200 && sendReceipt.json?.order?.status === 'paid', sendReceipt.json);

const leads = await api('GET', '/api/admin/leads', { token: superToken });
const myLead = (leads.json?.leads || []).find((l) => l.phone === '09121112233');
check('super لیست درخواست‌ها را می‌بیند', !!myLead && myLead.receipts === 1, leads.json?.leads);
const leadsByOwner = await api('GET', '/api/admin/leads', { token: ownerToken });
check('مالک به درخواست‌ها دسترسی ندارد → 403', leadsByOwner.status === 403, leadsByOwner.json);

const setStatus = await api('PUT', `/api/admin/leads/${myLead.id}`, { token: superToken, body: { status: 'contacted' } });
check('تغییر وضعیت درخواست → 200', setStatus.status === 200 && setStatus.json?.status === 'contacted', setStatus.json);
const badStatus = await api('PUT', `/api/admin/leads/${myLead.id}`, { token: superToken, body: { status: 'whatever' } });
check('وضعیت نامعتبر → 400', badStatus.status === 400, badStatus.json);

/* ساخت آرایشگاه از روی درخواست */
const fromLead = await api('POST', '/api/admin/shops', {
  token: superToken,
  body: { name: 'آرایشگاه جدید', location: 'ساری', ownerUsername: 'newowner', ownerPassword: 'pass1234', leadId: myLead.id },
});
check('ساخت آرایشگاه از lead → 200', fromLead.status === 200 && !!fromLead.json?.id, fromLead.json);
check('اشتراک به‌اندازهٔ پلن سفارش (۳ ماه)', fromLead.json?.expiresAt === addDays(tehranDate(), 90), fromLead.json);
const leadAfter = await api('GET', '/api/admin/leads', { token: superToken });
const leadRow = (leadAfter.json?.leads || []).find((l) => l.id === myLead.id);
check('درخواست «ساخته شد» و به آرایشگاه وصل شد', leadRow?.status === 'done' && leadRow?.shopId === fromLead.json.id, leadRow);
const twice = await api('POST', '/api/admin/shops', {
  token: superToken,
  body: { name: 'دوباره', location: 'ساری', ownerUsername: 'newowner2', ownerPassword: 'pass1234', leadId: myLead.id },
});
check('ساخت دوباره از همان lead → 409', twice.status === 409, twice.json);
const planOverride = await api('POST', '/api/admin/shops', {
  token: superToken,
  body: { name: 'با پلن دلخواه', location: 'ساری', ownerUsername: 'newowner3', ownerPassword: 'pass1234', leadId: myLead.id, plan: 6 },
});
check('پلن انتخابی super بر پلن سفارش مقدم است (بعد از 409 فقط مسیر را چک می‌کنیم)', planOverride.status === 409, planOverride.status);

/* ================================================================ 12. حذف و مسیرهای نامعلوم */
section('حذف و 404');
const delShop = await api('DELETE', `/api/admin/shops/${otherId}`, { token: ownerToken });
check('مالک نمی‌تواند آرایشگاه حذف کند → 403', delShop.status === 403, delShop.json);
const delOk = await api('DELETE', `/api/admin/shops/${otherId}`, { token: superToken });
check('super آرایشگاه را حذف کرد', delOk.status === 200, delOk.json);
const gone = await api('GET', `/api/shops/${otherId}`);
check('آرایشگاه حذف‌شده → 404', gone.status === 404, gone.json);
const ghost = await api('GET', '/api/does-not-exist');
check('مسیر نامعلوم API → 404', ghost.status === 404, ghost.json);
const adminPage = await call('GET', '/admin', {});
check('/admin صفحهٔ اصلی را سرو می‌کند (نه JSON)', adminPage.status === 200 && !adminPage.headers.get('content-type')?.includes('json'), adminPage.headers.get('content-type'));

/* ================================================================ جمع‌بندی */
console.log(`\n${pass} بررسی پاس، ${failures.length} ناموفق`);
if (failures.length) {
  console.log('ناموفق‌ها:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
