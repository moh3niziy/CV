'use strict';

/* ================================================================ icons */
const ICONS = {
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
  coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM6 2v2M10 2v2M14 2v2"/>',
  store: '<path d="M3 9h18l-1.5-5h-15zM4 9v11h16V9M9 20v-6h6v6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  instagram: '<rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.5 6.5h.01"/>',
  telegram: '<path d="M21.5 4.5 2.8 11.7c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.8 5.6c.3.8 1.3 1 1.9.4l2.6-2.5 4.8 3.5c.7.5 1.7.1 1.9-.7l3.1-15.3c.2-1-.8-1.8-1.6-1.5zM9 15l8.5-7.5"/>',
  power: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"/>',
  map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

/* ================================================================ helpers */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const fa = (v) => String(v).replace(/\d/g, (d) => FA_DIGITS[d]);
const toEn = (v) => String(v || '').replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d)).replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 1632).trim();
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const faTime = (t) => fa(typeof t === 'number' ? fromMin(t) : t);
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function fmtDur(min) {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${fa(m)} دقیقه`;
  if (!m) return `${fa(h)} ساعت`;
  return `${fa(h)} ساعت و ${fa(m)} دقیقه`;
}

const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => isoOf(new Date());
const addDays = (iso, n) => { const d = dateOf(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const weekday = (iso) => String(dateOf(iso).getDay());

const fmtPart = (opts) => new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', opts);
const F_WD = fmtPart({ weekday: 'long' });
const F_DAY = fmtPart({ day: 'numeric' });
const F_MON = fmtPart({ month: 'long' });
const F_YEAR = fmtPart({ year: 'numeric' });
const longDate = (iso) => { const d = dateOf(iso); return `${F_WD.format(d)} ${F_DAY.format(d)} ${F_MON.format(d)} ${F_YEAR.format(d)}`; };

// ترتیب هفتهٔ ایرانی: شنبه تا جمعه (کلیدها مطابق getDay)
const WEEK = [['6', 'شنبه'], ['0', 'یکشنبه'], ['1', 'دوشنبه'], ['2', 'سه‌شنبه'], ['3', 'چهارشنبه'], ['4', 'پنجشنبه'], ['5', 'جمعه']];

const AVATAR_COLORS = ['#5b4ff5', '#e5484d', '#0f9f6e', '#d97706', '#0ea5e9', '#c026d3', '#4f46e5', '#059669'];
function avatar(b, size = 46) {
  let h = 0; for (const c of b.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const initial = esc((b.name || '؟').trim().charAt(0));
  return `<span class="avatar" style="background:${AVATAR_COLORS[h % AVATAR_COLORS.length]};width:${size}px;height:${size}px">${initial}</span>`;
}

function toast(msg, isErr = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.innerHTML = icon(isErr ? 'alert' : 'check') + `<span>${esc(fa(msg))}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ================================================================ state */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* noop */ } },
};

const state = {
  auth: readStoredAuth(),   // {token, role: super|owner|barber, shopId, barberId, name}
  role: null,               // نقش در آرایشگاه باز شده (از سرور)
  accounts: null,           // نام‌های کاربری مالک و آرایشگرها (فقط برای مالک)
  shops: null,      // لیست آرایشگاه‌ها برای صفحهٔ اصلی
  shopId: null,     // آرایشگاه انتخاب‌شده (از آدرس صفحه)
  pub: null,        // داده برای نمای مشتری (بدون اطلاعات مشتری‌ها)
  admin: null,      // دادهٔ کامل ادمین
  version: 0,       // نسخهٔ داده در دیتابیس، برای جلوگیری از بازنویسی هم‌زمان
  barberId: store.get('hd_barber'),
  date: todayISO(),
  stripStart: todayISO(),
  tab: 'schedule',
};

class AppError extends Error { }

function readStoredAuth() {
  try { return JSON.parse(store.get('hd_auth')) || null; } catch { return null; }
}
const isSuper = () => state.auth?.role === 'super';
const canManage = () => state.role === 'owner' || state.role === 'super';
const canEnterShop = (id) => isSuper() || (!!state.auth && state.auth.shopId === id);

/* ================================================================ data */
// داده‌ها در دیتابیس Cloudflare D1 ذخیره می‌شوند و از طریق API همین سایت (worker.js) خوانده و نوشته می‌شوند.
function setAuth(a) { state.auth = a; store.set('hd_auth', a ? JSON.stringify(a) : null); store.set('hd_pass', null); }

async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.auth?.token) headers.Authorization = 'Bearer ' + state.auth.token;
  let res;
  try {
    res = await fetch('/api' + path, { method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new AppError('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path.startsWith('/admin')) {
      setAuth(null);
      state.admin = null;
      if (state.shopId) location.hash = `#/s/${encodeURIComponent(state.shopId)}`;
    }
    throw Object.assign(new AppError(json.error || 'خطایی رخ داد'), {
      status: res.status, expired: !!json.expired, readonly: !!json.readonly, support: json.support, shopName: json.shopName,
    });
  }
  return json;
}

function normalizeData(d) {
  return {
    barbers: Array.isArray(d?.barbers) ? d.barbers : [],
    appointments: Array.isArray(d?.appointments) ? d.appointments : [],
  };
}

const shopPath = () => `/admin/shops/${encodeURIComponent(state.shopId)}`;

async function loadShops() {
  state.shops = (await api('GET', '/shops')).shops;
}

async function loadAdmin() {
  const { shop, data, version, role, barberId, accounts, support } = await api('GET', `${shopPath()}/data`);
  state.support = support || null;
  state.shop = shop;
  state.role = role;
  state.accounts = accounts || null;
  if (role === 'barber') state.barberId = barberId;
  state.admin = normalizeData(data);
  state.version = version;
  return state.admin;
}

async function saveAdmin(data) {
  const keepFrom = addDays(todayISO(), -180); // نوبت‌های قدیمی‌تر از ۶ ماه پاک می‌شوند
  data.appointments = data.appointments.filter((a) => a.date >= keepFrom);
  const { version } = await api('PUT', `${shopPath()}/data`, { data, version: state.version });
  state.admin = data;
  state.version = version;
}

// خواندن آخرین نسخه، اعمال تغییر و ذخیره؛ اگر دستگاه دیگری هم‌زمان ذخیره کرده باشد دوباره تلاش می‌کند
async function mutate(fn) {
  for (let attempt = 0; ; attempt++) {
    const data = structuredClone(await loadAdmin());
    const result = fn(data);
    try {
      await saveAdmin(data);
      return result;
    } catch (err) {
      if (err.status !== 409 || attempt >= 3) throw err;
    }
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.admin, null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.shop?.name || 'hairdresser'}-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importData(file) {
  let parsed;
  try { parsed = JSON.parse(await file.text()); } catch { throw new AppError('فایل انتخاب‌شده معتبر نیست'); }
  if (!parsed || !Array.isArray(parsed.barbers)) throw new AppError('فایل انتخاب‌شده معتبر نیست');
  await loadAdmin();
  await saveAdmin(normalizeData(parsed));
}

async function loadPublic() {
  state.pub = await api('GET', `/shops/${encodeURIComponent(state.shopId)}`);
  state.shop = state.pub.shop;
}

/* ================================================================ validation */
const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);

function findIn(items, id, label) {
  const item = items.find((x) => x.id === id);
  if (!item) throw new AppError(`${label} پیدا نشد`);
  return item;
}

// پیش‌فرض آرایشگر جدید: شنبه تا پنجشنبه ۱۰ تا ۲۰ و دو خدمت رایج
function defaultBarber() {
  return {
    name: '', phone: '',
    hours: Object.fromEntries(WEEK.map(([k]) => [k, { on: k !== '5', start: '10:00', end: '20:00' }])),
    services: [
      { name: 'اصلاح مو', minutes: 30 },
      { name: 'اصلاح ریش', minutes: 15 },
    ],
  };
}

function applyBarber(data, body, id) {
  const name = String(body.name || '').trim();
  const phone = toEn(body.phone);
  if (!name) throw new AppError('نام آرایشگر را وارد کنید');
  if (!phone) throw new AppError('شماره تماس آرایشگر را وارد کنید');
  const hours = {};
  for (const [k] of WEEK) {
    const h = body.hours[k];
    if (h.on && toMin(h.end) <= toMin(h.start)) throw new AppError('ساعت پایان کار باید بعد از ساعت شروع باشد');
    hours[k] = { on: !!h.on, start: h.start, end: h.end };
  }
  const services = [];
  for (const s of body.services) {
    const minutes = parseInt(toEn(s.minutes), 10);
    if (!(minutes >= 5 && minutes <= 600)) throw new AppError(`مدت زمان خدمت «${s.name}» باید بین ۵ تا ۶۰۰ دقیقه باشد`);
    services.push({ id: s.id || newId(), name: s.name, minutes });
  }
  let barber = data.barbers.find((x) => x.id === id);
  if (!barber) { barber = { id: id || newId() }; data.barbers.push(barber); }
  Object.assign(barber, { name, phone, hours, services });
  return barber;
}

function applyAppointment(data, body, id) {
  const barber = findIn(data.barbers, body.barberId, 'آرایشگر');
  const customerName = String(body.customerName || '').trim();
  if (!customerName) throw new AppError('نام مشتری را وارد کنید');
  const chosen = barber.services.filter((s) => body.serviceIds.includes(s.id));
  if (!chosen.length) throw new AppError('حداقل یک خدمت انتخاب کنید');
  const start = toMin(body.start);
  const end = start + chosen.reduce((t, s) => t + s.minutes, 0);
  if (end > 1440) throw new AppError('زمان پایان نوبت از نیمه‌شب می‌گذرد');
  const clash = data.appointments.find((a) => a.id !== id && a.barberId === barber.id && a.date === body.date
    && start < toMin(a.end) && toMin(a.start) < end);
  if (clash) throw new AppError(`این بازه با نوبت «${clash.customerName}» (${clash.start} تا ${clash.end}) تداخل دارد`);

  let appt;
  if (id) appt = findIn(data.appointments, id, 'نوبت');
  else { appt = { id: newId(), createdAt: Date.now() }; data.appointments.push(appt); }
  Object.assign(appt, {
    barberId: barber.id, date: body.date, start: fromMin(start), end: fromMin(end),
    customerName, customerPhone: toEn(body.customerPhone),
    services: chosen.map((s) => ({ id: s.id, name: s.name, minutes: s.minutes })),
  });
  return appt;
}

/* ================================================================ schedule math */
function dayPlan(barber, date, appts, { fromNow = false } = {}) {
  const list = appts.filter((a) => a.barberId === barber.id && a.date === date).sort((a, b) => toMin(a.start) - toMin(b.start));
  const h = barber.hours?.[weekday(date)];
  if (!h || !h.on) return { closed: true, list, gaps: [], open: 0, close: 0 };
  const open = toMin(h.start), close = toMin(h.end);
  let cursor = open;
  const cutoff = fromNow && date === todayISO() ? Math.ceil(nowMin() / 5) * 5 : -1;
  cursor = Math.max(cursor, cutoff);
  const gaps = [];
  for (const a of list) {
    const s = toMin(a.start), e = toMin(a.end);
    if (s > cursor) gaps.push([cursor, Math.min(s, close)]);
    cursor = Math.max(cursor, e);
  }
  if (cursor < close) gaps.push([cursor, close]);
  return { closed: false, list, gaps: gaps.filter(([s, e]) => e - s >= 5), open, close, cutoff };
}

// نوار زمانی روز: بخش‌های خالی، رزرو و گذشته روی یک خط‌کش ساعت، به‌همراه نشانگر «الان».
// زمان از راست به چپ جلو می‌رود و زمان گذشته هاشور می‌خورد (روزهای گذشته کامل).
// نمای مشتری (customer): جملهٔ وضعیت بالای نوار، و نوبت‌های گذشته هم فقط «گذشته» نمایش داده می‌شوند.
// پنل مدیریت: نوبت‌های گذشته کم‌رنگ ولی قابل تشخیص می‌مانند.
function timelineHTML(plan, { customer = false } = {}) {
  const { open, close } = plan;
  const span = close - open;
  const pct = (m) => ((Math.min(Math.max(m, open), close) - open) / span) * 100;
  const today = todayISO();
  const now = state.date === today ? nowMin() : -1;
  const hasNow = now > open && now < close;
  const pastEnd = state.date < today ? close : now > open ? Math.min(now, close) : open;

  // بازه‌های رزرو، مرتب و ادغام‌شده
  const busy = [];
  for (const a of [...plan.list].sort((x, y) => toMin(x.start) - toMin(y.start))) {
    const s = Math.max(toMin(a.start), open), e = Math.min(toMin(a.end), close);
    if (e <= s) continue;
    const last = busy.at(-1);
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else busy.push([s, e]);
  }

  // تقسیم کل ساعت کاری به بخش‌های پشت‌سرهم
  const segs = [];
  const push = (kind, s, e) => {
    if (e <= s) return;
    const last = segs.at(-1);
    if (last && last.kind === kind && last.e === s) last.e = e;
    else segs.push({ kind, s, e });
  };
  const add = (kind, s, e) => {
    if (s < pastEnd) {
      push(kind === 'busy' && !customer ? 'was' : 'past', s, Math.min(e, pastEnd));
      s = Math.max(s, pastEnd);
    }
    push(kind, s, e);
  };
  let t = open;
  for (const [s, e] of busy) { add('free', t, s); add('busy', Math.max(s, t), e); t = Math.max(t, e); }
  add('free', t, close);

  const segHTML = segs.map(({ kind, s, e }) => {
    const w = pct(e) - pct(s);
    let label = '';
    if (kind === 'free') label = w >= 24 ? `خالی <small>${fmtDur(e - s)}</small>` : w >= 9 ? 'خالی' : '';
    else if (kind === 'busy' || kind === 'was') label = w >= 9 ? 'رزرو' : '';
    else if (w >= 16) label = 'گذشته';
    const name = { free: 'خالی', busy: 'رزرو شده', was: 'رزرو (گذشته)', past: 'گذشته' }[kind];
    const cls = kind === 'was' ? 'tl-busy tl-was' : `tl-${kind}`;
    return `<div class="tl-seg ${cls}" style="right:${pct(s)}%;width:${w}%" title="${name}: ${faTime(s)} تا ${faTime(e)}">${label}</div>`;
  }).join('');

  // خط‌کش ساعت: فقط ساعت‌های کامل، با فاصلهٔ مناسب برای طول روز
  const hours = span / 60;
  const step = (hours <= 7 ? 1 : hours <= 13 ? 2 : 3) * 60;
  let ticks = '';
  for (let m = Math.ceil(open / step) * step; m < close; m += step) {
    const p = pct(m);
    if (p < 15 || p > 85) continue; // جا برای برچسب‌های شروع و پایان
    ticks += `<span class="tl-tick" style="right:${p}%">${faTime(m)}</span>`;
  }

  const nowHTML = hasNow ? `
    <span class="tl-now" style="right:${Math.min(Math.max(pct(now), 9), 91)}%">الان ${faTime(now)}</span>
    <span class="tl-now-line" style="right:${pct(now)}%"></span>` : '';

  return `
    ${customer ? statusHTML(plan) : ''}
    <div class="tl ${hasNow ? 'has-now' : ''}">
      ${nowHTML}
      <div class="tl-bar">${segHTML}</div>
      <div class="tl-ticks">
        <span class="tl-end start">${faTime(open)}<small>شروع کار</small></span>
        ${ticks}
        <span class="tl-end finish">${faTime(close)}<small>پایان کار</small></span>
      </div>
    </div>`;
}

// جملهٔ وضعیت برای مشتری: الان خالی است یا رزرو، و اولین زمان خالی
function statusHTML(plan) {
  const today = state.date === todayISO();
  const n = nowMin();
  const first = plan.gaps[0];
  let kind = 'free', text;
  if (today && n >= plan.close) { kind = 'off'; text = 'ساعت کاری امروز تمام شده است'; }
  else if (!first) { kind = 'busy'; text = today ? 'تا پایان امروز زمان خالی وجود ندارد' : 'زمان خالی در این روز وجود ندارد'; }
  else if (today && n < plan.open) { text = `امروز از ساعت ${faTime(plan.open)} شروع می‌شود · اولین زمان خالی ${faTime(first[0])}`; }
  else if (today) {
    const current = plan.list.find((a) => toMin(a.start) <= n && n < toMin(a.end));
    if (current) { kind = 'busy'; text = `الان رزرو است · اولین زمان خالی از ساعت ${faTime(first[0])}`; }
    else text = `الان خالی است تا ساعت ${faTime(first[1])}`;
  } else {
    text = `اولین زمان خالی از ساعت ${faTime(first[0])}`;
  }
  return `<div class="tl-status ${kind}"><i></i><span>${text}</span></div>`;
}

/* ================================================================ shared UI pieces */
function dateStripHTML(barber, appts, { from, days, admin }) {
  let html = '';
  for (let i = 0; i < days; i++) {
    const iso = addDays(from, i);
    const d = dateOf(iso);
    const h = barber?.hours?.[weekday(iso)];
    const closed = barber && (!h || !h.on);
    const has = admin && barber && appts.some((a) => a.barberId === barber.id && a.date === iso);
    const cls = ['day', iso === state.date && 'active', iso === todayISO() && 'today', closed && 'closed'].filter(Boolean).join(' ');
    html += `<button class="${cls}" data-action="pick-date" data-date="${iso}">
      <div class="wd">${F_WD.format(d)}</div>
      <div class="dn">${F_DAY.format(d)}</div>
      <div class="mn">${F_MON.format(d)}</div>
      ${admin ? `<span class="dot ${has ? 'has' : ''}"></span>` : ''}
    </button>`;
  }
  return `<div class="date-strip" id="dateStrip">${html}</div>`;
}

function scrollActiveDay() {
  const strip = $('#dateStrip'), el = $('#dateStrip .day.active');
  if (!strip || !el) return;
  // فقط نوار روزها اسکرول شود، نه کل صفحه
  const s = strip.getBoundingClientRect(), r = el.getBoundingClientRect();
  strip.scrollLeft += (r.left + r.width / 2) - (s.left + s.width / 2);
}

function emptyHTML(ic, title, text, action = '') {
  return `<div class="empty"><div class="big-icon">${icon(ic)}</div><h3>${title}</h3><p>${text}</p>${action}</div>`;
}

function renderTopbar(view) {
  const shopName = view === 'home' ? 'آرایشگاه‌ها' : view === 'join' ? 'نوبت‌دهی آنلاین' : state.shop?.name || 'آرایشگاه';
  const shopHref = `#/s/${encodeURIComponent(state.shopId || '')}`;
  $('#shopName').textContent = shopName;
  $('.brand').setAttribute('href', view === 'home' ? '#/' : view === 'join' ? '#/join' : shopHref);
  document.title = view === 'home' ? 'آرایشگاه‌ها · نوبت‌دهی آنلاین'
    : view === 'join' ? 'سایت نوبت‌دهی برای آرایشگاه شما'
    : view === 'admin' ? `پنل مدیریت · ${shopName}` : shopName;
  const dark = document.documentElement.dataset.theme === 'dark';
  const themeBtn = `<button class="btn icon-btn" data-action="theme" title="${dark ? 'تم روشن' : 'تم تیره'}" aria-label="تغییر تم">${icon(dark ? 'sun' : 'moon')}</button>`;
  const logoutBtn = `<button class="btn btn-ghost icon-btn" data-action="logout" title="خروج">${icon('logout')}</button>`;
  // ورود به پنل دکمه ندارد: آیکون قیچی را ۲ ثانیه نگه دارید
  let actions;
  const who = state.auth ? `<span class="who">${icon('user')}<span>${esc(state.auth.name || '')}</span></span>` : '';
  if (view === 'home') actions = `${themeBtn}${isSuper() ? `${who}${logoutBtn}` : ''}`;
  else if (view === 'join') actions = themeBtn;
  else if (view === 'admin') actions = `${who}${themeBtn}<a class="btn" href="${shopHref}" title="نمای مشتری">${icon('eye')}<span class="btn-label-sm">نمای مشتری</span></a>${logoutBtn}`;
  else actions = `${shopLinksHTML(state.shop)}${themeBtn}`;
  $('#topActions').innerHTML = actions;
}

// آیکون‌های لوکیشن، تلگرام و اینستاگرام در نوار بالای صفحهٔ مشتری (فقط مواردی که ثبت شده‌اند)
function shopLinksHTML(shop) {
  if (!shop) return '';
  const link = (cls, href, ic, label) =>
    `<a class="btn icon-btn top-link ${cls}" href="${esc(href)}" target="_blank" rel="noopener" title="${label}" aria-label="${label}">${icon(ic)}</a>`;
  let html = '';
  if (shop.location) {
    const href = /^https?:\/\//i.test(shop.location) ? shop.location
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`;
    html += link('loc', href, 'pin', /^https?:/i.test(shop.location) ? 'لوکیشن روی نقشه' : `لوکیشن: ${shop.location}`);
  }
  if (shop.telegram) html += link('tg', `https://t.me/${encodeURIComponent(shop.telegram)}`, 'telegram', 'تلگرام');
  if (shop.instagram) html += link('ig', `https://instagram.com/${encodeURIComponent(shop.instagram)}`, 'instagram', 'اینستاگرام');
  return html;
}

/* ================================================================ credentials fields */
function credFieldsHTML(prefix, username, passRequired, title) {
  return `
    <div class="cred-box">
      <div class="label">${icon('lock')} ${title}</div>
      <div class="row cred-row">
        <div class="field">
          <label for="${prefix}User">نام کاربری</label>
          <input class="input ltr-input" id="${prefix}User" value="${esc(username || '')}" maxlength="32" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="reza">
        </div>
        <div class="field">
          <label for="${prefix}Pass">${passRequired ? 'رمز عبور' : 'رمز عبور جدید'}</label>
          <input class="input ltr-input" id="${prefix}Pass" type="password" maxlength="64" autocomplete="new-password" placeholder="${passRequired ? 'حداقل ۴ کاراکتر' : 'خالی = بدون تغییر'}">
        </div>
      </div>
      <span class="hint">نام کاربری فقط حروف انگلیسی، عدد و . _ - (حداقل ۳ کاراکتر).</span>
    </div>`;
}

/* ================================================================ social pages */
function socialFieldsHTML(prefix, shop) {
  return `
    <div class="row cred-row">
      <div class="field">
        <label for="${prefix}Ig">${icon('instagram')} اینستاگرام <span class="muted" style="font-weight:400">(اختیاری)</span></label>
        <input class="input ltr-input" id="${prefix}Ig" value="${esc(shop?.instagram ? '@' + shop.instagram : '')}" maxlength="100" autocapitalize="none" spellcheck="false" placeholder="@page_id">
      </div>
      <div class="field">
        <label for="${prefix}Tg">${icon('telegram')} تلگرام <span class="muted" style="font-weight:400">(اختیاری)</span></label>
        <input class="input ltr-input" id="${prefix}Tg" value="${esc(shop?.telegram ? '@' + shop.telegram : '')}" maxlength="100" autocapitalize="none" spellcheck="false" placeholder="@channel_id">
      </div>
    </div>
    <span class="hint" style="display:block;margin:-8px 0 16px">آیدی یا لینک صفحه را وارد کنید.</span>`;
}

/* ================================================================ home (shops) */
function renderHome() {
  renderTopbar('home');
  const shops = state.shops;
  const addBtn = isSuper() ? `<button class="btn btn-primary" data-action="new-shop">${icon('plus')}افزودن آرایشگاه</button>` : '';

  let body;
  if (!shops.length) {
    body = `<div class="card">${emptyHTML('store', 'هنوز آرایشگاهی ثبت نشده',
      isSuper() ? 'اولین آرایشگاه را با نام، لوکیشن و حساب مالک ثبت کنید.' : 'به‌زودی آرایشگاه‌ها اینجا نمایش داده می‌شوند.',
      isSuper() ? addBtn : '')}</div>`;
  } else {
    body = `
      ${shops.length > 3 ? `<div class="search">${icon('search')}<input class="input" id="shopSearch" placeholder="جستجوی نام یا محله…" autocomplete="off"></div>` : ''}
      <div class="shop-list" id="shopList">
        ${shops.map((x) => `
          <div class="shop-card ${x.active === false || x.sub?.state === 'expired' ? 'inactive' : ''}" data-action="open-shop" data-id="${esc(x.id)}" data-q="${esc((x.name + ' ' + x.location).toLowerCase())}" role="link" tabindex="0">
            <span class="shop-icon">${icon('store')}</span>
            <div class="info">
              <div class="name">${esc(x.name)}${x.active === false ? ' <span class="badge">غیرفعال</span>' : ''}</div>
              <div class="sub">${icon('pin')}<span>${/^https?:\/\//i.test(x.location) ? 'لوکیشن روی نقشه' : esc(fa(x.location || '—'))}</span></div>
              <div class="sub">${icon('users')}<span>${x.barbers ? `${fa(x.barbers)} آرایشگر` : 'بدون آرایشگر'}</span></div>
              ${isSuper() && x.sub ? `<div class="sub">${icon('calendar')}${subBadgeHTML(x.sub)}</div>` : ''}
            </div>
            ${isSuper() ? `<div class="shop-actions">
              <button class="btn icon-btn sm" data-action="sub-shop" data-id="${esc(x.id)}" title="اشتراک">${icon('calendar')}</button>
              <button class="btn icon-btn sm" data-action="edit-shop" data-id="${esc(x.id)}" title="ویرایش">${icon('edit')}</button>
              <button class="btn icon-btn sm ${x.active === false ? 'btn-on' : 'btn-warn'}" data-action="toggle-shop" data-id="${esc(x.id)}" title="${x.active === false ? 'فعال کردن' : 'غیرفعال کردن'}">${icon('power')}</button>
              <button class="btn icon-btn sm btn-danger" data-action="del-shop" data-id="${esc(x.id)}" title="حذف">${icon('trash')}</button>
            </div>` : `<span class="chev">${icon('left')}</span>`}
          </div>`).join('')}
      </div>
      <div class="card hidden" id="shopNone">${emptyHTML('search', 'آرایشگاهی پیدا نشد', 'عبارت دیگری را جستجو کنید.')}</div>`;
  }

  const leadsTab = isSuper() && state.homeTab === 'leads';
  const newLeads = (state.leads || []).filter((l) => l.status === 'new').length;
  $('#app').innerHTML = `
    <div class="page">
      <div class="admin-head">
        <section class="hero" style="padding:0">
          <h1>${leadsTab ? 'درخواست‌های ساخت سایت' : 'آرایشگاه موردنظر را انتخاب کنید'}</h1>
          <p>${leadsTab ? 'افرادی که از صفحهٔ «تو هم می‌خواهی؟» درخواست داده‌اند.' : 'زمان‌های خالی هر آرایشگاه را ببینید و برای رزرو تماس بگیرید.'}</p>
        </section>
        ${isSuper() ? `<div class="seg" role="tablist">
          <button class="${leadsTab ? '' : 'active'}" data-action="home-tab" data-tab="shops">${icon('store')}آرایشگاه‌ها</button>
          <button class="${leadsTab ? 'active' : ''}" data-action="home-tab" data-tab="leads">${icon('users')}درخواست‌ها${newLeads ? ` <span class="count">${fa(newLeads)}</span>` : ''}</button>
        </div>` : ''}
      </div>
      ${leadsTab ? leadsHTML() : `${shops.length && addBtn ? `<div style="margin-top:16px">${addBtn}</div>` : ''}<div style="margin-top:20px">${body}</div>`}
    </div>`;

  const search = $('#shopSearch');
  if (search) search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    $$('#shopList .shop-card').forEach((c) => { const ok = !q || c.dataset.q.includes(q); c.classList.toggle('hidden', !ok); shown += ok; });
    $('#shopNone').classList.toggle('hidden', shown > 0);
  });
}

async function openShopModal(shop) {
  let owner = '';
  if (shop) {
    try {
      const full = await api('GET', `/admin/shops/${encodeURIComponent(shop.id)}/data`);
      owner = full.accounts?.owner || '';
      shop = { ...shop, ...full.shop };
    } catch (err) { toast(err.message, true); return; }
  }
  openModal(`
    <div class="modal sm" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>${shop ? 'ویرایش آرایشگاه' : 'آرایشگاه جدید'}</h2>
        <button class="btn btn-ghost icon-btn sm" data-action="close" aria-label="بستن">${icon('x')}</button>
      </div>
      <form class="modal-body" id="shopForm" autocomplete="off">
        <div class="field">
          <label for="sName">نام آرایشگاه</label>
          <input class="input" id="sName" required maxlength="60" value="${esc(shop?.name || '')}" placeholder="مثلاً آرایشگاه رضا">
        </div>
        <div class="field">
          <label for="sLoc">لوکیشن</label>
          <textarea class="input" id="sLoc" required maxlength="300" rows="3" placeholder="آدرس، یا لینک لوکیشن از گوگل‌مپ / نشان / بلد">${esc(shop?.location || '')}</textarea>
          <span class="hint">آدرس متنی یا لینک نقشه؛ برای مشتری‌ها با دکمهٔ «نمایش روی نقشه» نشان داده می‌شود.</span>
        </div>
        ${socialFieldsHTML('s', shop)}
        ${credFieldsHTML('o', owner, !shop || !owner, 'حساب مالک آرایشگاه')}
      </form>
      <div class="modal-foot">
        <button class="btn btn-primary btn-lg" id="shopSave">${icon('check')}${shop ? 'ذخیرهٔ تغییرات' : 'ثبت آرایشگاه'}</button>
        <button class="btn btn-lg" data-action="close">انصراف</button>
      </div>
    </div>`);
  const save = $('#shopSave');
  $('#shopForm').addEventListener('submit', (ev) => { ev.preventDefault(); save.click(); });
  save.addEventListener('click', async () => {
    const payload = {
      name: $('#sName').value.trim(), location: $('#sLoc').value.trim(),
      instagram: $('#sIg').value.trim(), telegram: $('#sTg').value.trim(),
      ownerUsername: toEn($('#oUser').value).toLowerCase(), ownerPassword: toEn($('#oPass').value),
    };
    if (!payload.name) { $('#sName').focus(); toast('نام آرایشگاه را وارد کنید', true); return; }
    if (!payload.location) { $('#sLoc').focus(); toast('لوکیشن آرایشگاه را وارد کنید', true); return; }
    if (!payload.ownerUsername) { $('#oUser').focus(); toast('نام کاربری مالک را وارد کنید', true); return; }
    if ((!shop || !owner) && !payload.ownerPassword) { $('#oPass').focus(); toast('رمز عبور مالک را وارد کنید', true); return; }
    save.disabled = true;
    try {
      if (shop) await api('PUT', `/admin/shops/${encodeURIComponent(shop.id)}`, payload);
      else await api('POST', '/admin/shops', payload);
      closeModal();
      toast(shop ? 'تغییرات ذخیره شد' : 'آرایشگاه ثبت شد');
      render();
    } catch (err) {
      toast(err.message, true);
      save.disabled = false;
    }
  });
  setTimeout(() => $('#sName').focus(), 60);
}

/* ================================================================ customer view */
function currentBarber(barbers) {
  let b = barbers.find((x) => x.id === state.barberId);
  if (!b) { b = barbers[0]; state.barberId = b?.id || null; }
  return b;
}

function renderUser() {
  renderTopbar('user');
  const { barbers, busy } = state.pub;
  if (state.date < todayISO()) state.date = todayISO();

  if (!barbers.length) {
    $('#app').innerHTML = `<div class="page">
      <section class="hero"><h1>${esc(state.shop.name)}</h1></section>
      <div class="card" style="margin-top:20px">${emptyHTML('scissors', 'هنوز آرایشگری ثبت نشده', 'به‌زودی زمان‌های خالی اینجا نمایش داده می‌شود.')}</div>
      ${promoHTML()}</div>`;
    return;
  }

  const b = currentBarber(barbers);
  const plan = dayPlan(b, state.date, busy, { fromNow: true });
  const freeTotal = plan.gaps.reduce((s, [a, c]) => s + c - a, 0);

  let slots;
  if (plan.closed) {
    slots = emptyHTML('coffee', 'این روز تعطیل است', 'لطفاً روز دیگری را انتخاب کنید.');
  } else if (!plan.gaps.length) {
    slots = emptyHTML('calendar', 'زمان خالی وجود ندارد', state.date === todayISO() ? 'ساعت کاری امروز پر شده یا به پایان رسیده است.' : 'تمام نوبت‌های این روز رزرو شده‌اند.');
  } else {
    slots = `<div class="slots">${plan.gaps.map(([s, e]) => `
      <div class="slot">
        <div class="range">${faTime(s)} <span class="muted">تا</span> ${faTime(e)}</div>
        <div class="len">${fmtDur(e - s)} زمان آزاد</div>
      </div>`).join('')}</div>`;
  }

  $('#app').innerHTML = `
  <div class="page">
    <section class="hero">
      <h1>${esc(state.shop.name)}</h1>
    </section>

    ${barbers.length > 1 ? `<div class="section-title"><span>انتخاب آرایشگر</span></div>
    <div class="barber-list">
      ${barbers.map((x) => `
        <button class="barber-pick ${x.id === b.id ? 'active' : ''}" data-action="pick-barber" data-id="${x.id}">
          ${avatar(x)}
          <div><div class="name">${esc(x.name)}</div><div class="sub">${fa(x.services.length)} خدمت</div></div>
        </button>`).join('')}
    </div>` : ''}

    <div class="section-title"><span>انتخاب روز</span></div>
    ${dateStripHTML(b, busy, { from: todayISO(), days: 21, admin: false })}

    <div class="grid-2">
      <div class="card">
        <div class="section-title" style="margin-top:0">
          <span>${longDate(state.date)}</span>
          ${!plan.closed ? `<span class="muted">ساعت کاری ${faTime(plan.open)} تا ${faTime(plan.close)}</span>` : ''}
        </div>
        ${!plan.closed ? timelineHTML(plan, { customer: true }) + `
          <div class="legend">
            <span><i class="lg-free"></i>خالی</span>
            <span><i class="lg-busy"></i>رزرو شده</span>
            ${plan.cutoff > plan.open ? '<span><i class="lg-past"></i>گذشته</span>' : ''}
          </div>` : ''}
        <div class="section-title">
          <span>زمان‌های خالی</span>
          ${freeTotal ? `<span class="muted">مجموع ${fmtDur(freeTotal)}</span>` : ''}
        </div>
        ${slots}
      </div>

      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card call-card">
          <div>
            <h3>رزرو نوبت با ${esc(b.name)}</h3>
            <p>برای رزرو یکی از زمان‌های خالی تماس بگیرید</p>
          </div>
          <a class="btn btn-lg" href="tel:${esc(b.phone)}">${icon('phone')}<span class="ltr">${fa(esc(b.phone))}</span></a>
        </div>
        ${b.services.length ? `
        <div class="card">
          <div class="section-title" style="margin-top:0"><span>خدمات و زمان تقریبی</span></div>
          <div class="service-list">
            ${b.services.map((s) => `<span class="tag">${esc(s.name)} <b>${fmtDur(s.minutes)}</b></span>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>
    ${promoHTML()}
  </div>`;
  scrollActiveDay();
}

/* ================================================================ promo + join page */
// لینک تبلیغاتی پایین صفحهٔ مشتری همهٔ آرایشگاه‌ها
function promoHTML() {
  if (!state.shop) return '';
  return `<a class="promo" href="#/join/${encodeURIComponent(state.shopId || '')}">
    <span class="promo-icon">${icon('scissors')}</span>
    <span>تو هم می‌خوای یک سایت مثل «${esc(state.shop.name)}» داشته باشی؟ <b>کلیک کن</b></span>
  </a>`;
}

function renderJoin(from) {
  renderTopbar('join');
  const features = [
    ['calendar', 'زمان‌های خالی، آنلاین', 'مشتری قبل از تماس می‌بیند کِی وقت دارید؛ بدون تماس‌های بی‌نتیجه.'],
    ['clock', 'ثبت نوبت با یک کلیک', 'خدمات و مدت هرکدام را یک بار تعریف کنید؛ پایان نوبت خودکار حساب می‌شود.'],
    ['users', 'برای یک یا چند آرایشگر', 'هر آرایشگر حساب و برنامهٔ خودش را دارد و شما همه را مدیریت می‌کنید.'],
    ['store', 'صفحهٔ اختصاصی آرایشگاه', 'با لوکیشن، اینستاگرام، تلگرام و حتی دامنهٔ اختصاصی خودتان.'],
  ];
  // تعرفه‌ها (تومان). صرفه‌جویی نسبت به پرداخت ماهانه حساب می‌شود
  const MONTHLY = 1_000_000;
  const plans = [
    { months: 1, price: 1_000_000, title: 'ماهانه' },
    { months: 3, price: 2_000_000, title: 'سه‌ماهه' },
    { months: 6, price: 3_000_000, title: 'شش‌ماهه', best: true },
  ];
  const toman = (n) => n >= 1e6 && n % 1e6 === 0 ? `${fa(n / 1e6)} میلیون` : `${fa(Math.round(n / 1e3).toLocaleString('en'))} هزار`;
  const planHTML = (p) => {
    const save = MONTHLY * p.months - p.price;
    return `<div class="plan ${p.best ? 'best' : ''}">
      ${p.best ? `<span class="plan-flag">${icon('star')}به‌صرفه‌ترین</span>` : ''}
      <div class="plan-title">${p.title}</div>
      <div class="plan-price"><b>${toman(p.price)}</b> تومان</div>
      <div class="plan-per">${p.months > 1 ? `ماهی ${toman(p.price / p.months)} تومان` : 'پرداخت ماه‌به‌ماه'}</div>
      ${save > 0 ? `<div class="plan-save">${fa(Math.round(save / (MONTHLY * p.months) * 100))}٪ تخفیف · ${toman(save)} تومان صرفه‌جویی</div>` : '<div class="plan-save muted-save">بدون تعهد بلندمدت</div>'}
    </div>`;
  };

  $('#app').innerHTML = `
    <div class="page join">
      <section class="join-hero">
        <h1>سایت نوبت‌دهی اختصاصی برای آرایشگاه شما</h1>
        <p>دفترچهٔ نوبت را کنار بگذارید. مشتری‌ها زمان‌های خالی را آنلاین می‌بینند و شما نوبت‌ها را از گوشی مدیریت می‌کنید.</p>
        <div class="join-contact" id="joinContactTop"></div>
      </section>

      <section class="pricing">
        <h2>تعرفه‌ها</h2>
        <div class="plans">${plans.map(planHTML).join('')}</div>
        <div class="gift">
          <span class="gift-icon">${icon('gift')}</span>
          <div><b>یک ماه رایگان هدیه بگیرید!</b>
            <p>با معرفی ما در پیج اینستاگرام آرایشگاهتان (پست مشترک)، یک ماه اشتراک رایگان به اشتراکتان اضافه می‌شود.</p></div>
        </div>
      </section>

      <div class="join-grid">
        <div class="join-features">
          ${features.map(([ic, t, d]) => `<div class="feature"><span class="feature-icon">${icon(ic)}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}
        </div>
        <div class="card" id="joinBox">
          <h2 style="margin:0 0 4px;font-size:18px">درخواست ساخت سایت</h2>
          <p class="muted" style="margin:0 0 16px;font-size:13.5px">اطلاعاتتان را بگذارید، برای هماهنگی با شما تماس می‌گیریم.</p>
          <form id="joinForm" autocomplete="on">
            <div class="field">
              <label for="jName">نام و نام خانوادگی</label>
              <input class="input" id="jName" name="name" maxlength="60" required autocomplete="name">
            </div>
            <div class="field">
              <label for="jPhone">شماره تماس</label>
              <input class="input ltr-input" id="jPhone" name="phone" type="tel" inputmode="tel" maxlength="16" required autocomplete="tel" placeholder="۰۹۱۲۰۰۰۰۰۰۰">
            </div>
            <div class="field">
              <label for="jNote">توضیحات <span class="muted" style="font-weight:400">(اختیاری)</span></label>
              <textarea class="input" id="jNote" name="note" rows="3" maxlength="600" placeholder="نام آرایشگاه، شهر، تعداد آرایشگرها یا هر سؤالی که دارید"></textarea>
            </div>
            <input type="text" name="website" id="jWebsite" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
            <button class="btn btn-primary btn-lg btn-block" id="joinSave">${icon('check')}ارسال درخواست</button>
          </form>
        </div>
      </div>

      <section class="join-bottom">
        <b>سؤالی دارید؟ مستقیم با ما در تماس باشید</b>
        <div class="join-contact" id="joinContactBottom"></div>
      </section>
    </div>`;

  // راه‌های تماس از سرور خوانده می‌شود تا فقط یک جا تعریف شوند
  api('GET', '/support').then(({ support }) => {
    ['#joinContactTop', '#joinContactBottom'].forEach((sel) => { const el = $(sel); if (el) el.innerHTML = supportHTML(support); });
  }).catch(() => {});

  $('#joinForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = $('#joinSave');
    btn.disabled = true;
    try {
      const res = await api('POST', '/leads', {
        name: $('#jName').value.trim(), phone: toEn($('#jPhone').value), note: $('#jNote').value.trim(),
        website: $('#jWebsite').value, source: from || '',
      });
      $('#joinBox').innerHTML = `
        <div class="empty" style="padding:20px 8px 8px">
          <div class="big-icon" style="background:var(--free-soft);color:var(--free)">${icon('check')}</div>
          <h3>درخواست شما ثبت شد</h3>
          <p>به‌زودی برای هماهنگی با شما تماس می‌گیریم. اگر عجله دارید، مستقیم پیام بدهید:</p>
        </div>
        ${supportHTML(res.support)}`;
    } catch (err) {
      btn.disabled = false;
      toast(err.message, true);
    }
  });
}

// لیست درخواست‌ها در پنل مدیر سایت
const LEAD_STATUS = [['new', 'جدید'], ['contacted', 'تماس گرفته شد'], ['done', 'آرایشگاه ساخته شد'], ['rejected', 'منصرف شد']];
function leadsHTML() {
  const leads = state.leads || [];
  if (!leads.length) {
    return `<div class="card" style="margin-top:20px">${emptyHTML('users', 'هنوز درخواستی نیامده', 'درخواست‌ها از لینک پایین صفحهٔ آرایشگاه‌ها یا صفحهٔ #/join ثبت می‌شوند.')}</div>`;
  }
  return `<div class="leads">${leads.map((l) => {
    const d = new Date(l.createdAt);
    const when = `${shortDate(isoOf(d))} · ${faTime(d.getHours() * 60 + d.getMinutes())}`;
    return `<div class="card lead lead-${l.status}">
      <div class="lead-head">
        <div><b>${esc(l.name)}</b> <span class="badge lead-badge">${LEAD_STATUS.find(([k]) => k === l.status)?.[1] || ''}</span></div>
        <span class="muted" style="font-size:12.5px">${when}</span>
      </div>
      <div class="support" style="margin:8px 0">
        <a class="btn" href="tel:${esc(l.phone)}">${icon('phone')}<span class="ltr">${fa(esc(l.phone))}</span></a>
        <a class="btn" href="sms:${esc(l.phone)}">${icon('chat')}پیامک</a>
      </div>
      ${l.note ? `<p class="lead-note">${esc(l.note)}</p>` : ''}
      ${l.sourceName ? `<div class="muted" style="font-size:12.5px;margin-bottom:8px">از صفحهٔ «${esc(l.sourceName)}»</div>` : ''}
      <div class="lead-foot">
        <div class="pick-chips">${LEAD_STATUS.map(([k, t]) => `<button class="pick mini ${l.status === k ? 'active' : ''}" data-action="lead-status" data-id="${esc(l.id)}" data-status="${k}">${t}</button>`).join('')}</div>
        <button class="btn icon-btn sm btn-danger" data-action="del-lead" data-id="${esc(l.id)}" title="حذف">${icon('trash')}</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

/* ================================================================ login */
// صفحهٔ اصلی: ورود مدیر سایت · صفحهٔ آرایشگاه: ورود مالک یا آرایشگر؛ هر دو با نام کاربری و رمز
function openLogin(next) {
  const shopId = route().view === 'home' ? null : state.shopId;
  openModal(`
    <div class="modal sm" role="dialog" aria-modal="true">
      <div class="modal-head"><span></span><button class="btn btn-ghost icon-btn sm" data-action="close" aria-label="بستن">${icon('x')}</button></div>
      <form class="modal-body" id="loginForm" style="text-align:center;padding-bottom:24px">
        <div class="login-icon">${icon('lock')}</div>
        <h2 style="margin:0 0 4px;font-size:19px">${shopId ? `ورود به ${esc(state.shop?.name || 'آرایشگاه')}` : 'ورود مدیر سایت'}</h2>
        <p class="muted" style="margin:0 0 18px">${shopId ? 'مالک یا آرایشگر با نام کاربری و رمز خود وارد شود' : 'نام کاربری و رمز عبور مدیر سایت را وارد کنید'}</p>
        <input class="input ltr-input" id="loginUser" placeholder="نام کاربری" autocomplete="username" autocapitalize="none" spellcheck="false" required style="margin-bottom:10px;text-align:center">
        <input class="input ltr-input" id="pin" type="password" placeholder="رمز عبور" style="text-align:center" autocomplete="current-password" maxlength="64" required>
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:14px">ورود</button>
      </form>
    </div>`);
  const pin = $('#pin');
  setTimeout(() => $('#loginUser').focus(), 50);
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#loginForm button');
    btn.disabled = true;
    try {
      const password = pin.value;
      const username = toEn($('#loginUser').value).toLowerCase();
      const auth = shopId
        ? await api('POST', `/shops/${encodeURIComponent(shopId)}/login`, { username, password })
        : await api('POST', '/login', { username, password });
      setAuth(auth);
      closeModal();
      toast(`خوش آمدید${auth.name ? '، ' + auth.name : ''}`);
      if (next && location.hash !== next) location.hash = next;
      else render();
    } catch (err) {
      btn.disabled = false;
      pin.value = '';
      const form = $('#loginForm');
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      toast(err.message, true);
    }
  });
}

/* ================================================================ subscription */
const isReadOnly = () => state.shop?.sub?.state === 'grace' && state.role !== 'super';
const shortDate = (iso) => { const d = dateOf(iso); return `${F_DAY.format(d)} ${F_MON.format(d)} ${F_YEAR.format(d)}`; };

// راه‌های تماس با پشتیبانی برای تمدید اشتراک (تلگرام، تماس، پیامک)
function supportHTML(support) {
  if (!support) return '';
  const tg = support.telegram, ph = support.phone;
  return `<div class="support">
    ${tg ? `<a class="btn support-tg" href="https://t.me/${encodeURIComponent(tg)}" target="_blank" rel="noopener">${icon('telegram')}<span class="ltr">@${esc(tg)}</span></a>` : ''}
    ${ph ? `<a class="btn" href="tel:${esc(ph)}">${icon('phone')}<span class="ltr">${fa(esc(ph))}</span></a>
    <a class="btn" href="sms:${esc(ph)}">${icon('chat')}پیامک</a>` : ''}
  </div>`;
}

function subBannerHTML() {
  const sub = state.shop?.sub;
  if (!sub) return '';
  if (sub.state === 'warning') {
    const when = sub.daysLeft === 0 ? 'امروز آخرین روز اشتراک این آرایشگاه است' : `اشتراک این آرایشگاه ${fa(sub.daysLeft)} روز دیگر (${shortDate(sub.expiresAt)}) تمام می‌شود`;
    return `<div class="sub-banner warn">${icon('alert')}<div><b>${when}.</b>
      <p>برای تمدید اشتراک با پشتیبانی تماس بگیرید:</p>${supportHTML(state.support)}</div></div>`;
  }
  if (sub.state === 'grace') {
    return `<div class="sub-banner busy">${icon('lock')}<div><b>اشتراک این آرایشگاه تمام شده است.</b>
      <p>پنل ${sub.graceLeft ? `تا ${fa(sub.graceLeft)} روز دیگر` : 'تا پایان امروز'} فقط قابل مشاهده است و پس از آن آرایشگاه غیرفعال می‌شود و برای مشتری‌ها هم نمایش داده نمی‌شود. برای تمدید تماس بگیرید:</p>
      ${supportHTML(state.support)}</div></div>`;
  }
  return '';
}

// صفحهٔ آرایشگاه منقضی: یک پیام در وسط صفحه
function expiredHTML(support, shopName) {
  return `<div class="expired-wrap"><div class="card expired-card">
    <div class="big-icon">${icon('lock')}</div>
    ${shopName ? `<div class="expired-shop">${esc(shopName)}</div>` : ''}
    <h2>اشتراک این آرایشگاه به پایان رسیده است</h2>
    <p>نوبت‌دهی آنلاین فعلاً در دسترس نیست. مدیریت آرایشگاه می‌تواند برای تمدید اشتراک و فعال‌سازی دوباره با پشتیبانی در ارتباط باشد:</p>
    ${supportHTML(support)}
  </div></div>`;
}

/* ================================================================ subscription management (site admin) */
const J_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const F_JNUM = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' });

function toJalali(iso) {
  const p = Object.fromEntries(F_JNUM.formatToParts(new Date(iso + 'T00:00:00Z')).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}
// تاریخ شمسی به میلادی؛ تخمین اولیه و سپس تصحیح روزبه‌روز با Intl. تاریخ نامعتبر (مثلاً ۳۱ مهر) null می‌دهد
function fromJalali(y, m, d) {
  let t = Date.UTC(y + 621, 2, 21) + ((m <= 6 ? (m - 1) * 31 : 186 + (m - 7) * 30) + d - 1) * 864e5;
  for (let i = 0; i < 8; i++) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const j = toJalali(iso);
    const cmp = (y - j.y) || (m - j.m) || (d - j.d);
    if (!cmp) return iso;
    t += Math.sign(cmp) * 864e5;
  }
  return null;
}
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

function subBadgeHTML(sub) {
  if (!sub?.expiresAt) return '<span class="badge sb-ok">بدون محدودیت</span>';
  if (sub.state === 'expired') return `<span class="badge sb-bad">منقضی از ${shortDate(sub.expiresAt)}</span>`;
  if (sub.state === 'grace') return `<span class="badge sb-bad">مهلت تمدید · ${sub.graceLeft ? `${fa(sub.graceLeft)} روز` : 'امروز'}</span>`;
  const label = sub.daysLeft === 0 ? 'امروز تمام می‌شود' : `${fa(sub.daysLeft)} روز مانده`;
  return `<span class="badge ${sub.state === 'warning' ? 'sb-warn' : 'sb-ok'}">${label}</span>`;
}

function openSubModal(shop) {
  if (!shop) return;
  const sub = shop.sub || {};
  const today = todayISO();
  // تمدید از پایان اشتراک فعلی؛ اگر تمام شده باشد از امروز
  const base = sub.expiresAt && sub.expiresAt >= today ? sub.expiresAt : today;
  const presets = [[30, '۱ ماه'], [90, '۳ ماه'], [180, '۶ ماه'], [365, '۱ سال']];
  const cur = toJalali(sub.expiresAt || base);
  const years = []; for (let y = toJalali(today).y - 1; y <= toJalali(today).y + 5; y++) years.push(y);

  openModal(`
    <div class="modal sm" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>اشتراک «${esc(shop.name)}»</h2>
        <button class="btn btn-ghost icon-btn sm" data-action="close" aria-label="بستن">${icon('x')}</button>
      </div>
      <div class="modal-body" id="subForm">
        <div class="summary">
          <span>وضعیت: ${subBadgeHTML(sub)}</span>
          <span class="muted" style="font-size:13px">${sub.expiresAt ? `پایان: ${shortDate(sub.expiresAt)}` : ''}</span>
        </div>

        <div class="field">
          <label>تمدید <span class="muted" style="font-weight:400">— از ${base === today ? 'امروز' : `پایان اشتراک فعلی (${shortDate(base)})`}</span></label>
          <div class="pick-chips">
            ${presets.map(([n, t]) => `<button type="button" class="pick" data-days="${n}">${icon('plus')}${t}</button>`).join('')}
          </div>
        </div>

        <div class="field">
          <label for="subDays">یا تعداد روز دلخواه</label>
          <div class="row"><input class="input ltr-input" id="subDays" inputmode="numeric" maxlength="5" placeholder="مثلاً ۴۵" style="max-width:140px"><span class="muted">روز</span></div>
        </div>

        <div class="field">
          <label>یا اشتراک تا تاریخ</label>
          <div class="row jdate">
            <select class="input" id="subD">${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${i + 1 === cur.d ? 'selected' : ''}>${fa(i + 1)}</option>`).join('')}</select>
            <select class="input" id="subM">${J_MONTHS.map((n, i) => `<option value="${i + 1}" ${i + 1 === cur.m ? 'selected' : ''}>${n}</option>`).join('')}</select>
            <select class="input" id="subY">${years.map((y) => `<option value="${y}" ${y === cur.y ? 'selected' : ''}>${fa(y)}</option>`).join('')}</select>
          </div>
        </div>

        <div id="subPreview"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-primary btn-lg" id="subSave">${icon('check')}ذخیرهٔ اشتراک</button>
        <button class="btn btn-lg" data-action="close">انصراف</button>
      </div>
    </div>`);

  const form = $('#subForm');
  let target = sub.expiresAt || null;

  const setSelects = (iso) => { const j = toJalali(iso); $('#subY').value = String(j.y); $('#subM').value = String(j.m); $('#subD').value = String(j.d); };
  const update = () => {
    $$('[data-days]', form).forEach((b) => b.classList.toggle('active', !!target && addDays(base, Number(b.dataset.days)) === target && !$('#subDays').value));
    let html;
    if (!target) html = `<div class="alert alert-busy">${icon('alert')}<span>تاریخ انتخاب‌شده معتبر نیست.</span></div>`;
    else {
      const left = daysBetween(today, target);
      const note = left < 0 ? 'این تاریخ گذشته است؛ آرایشگاه بلافاصله در مهلت تمدید یا منقضی قرار می‌گیرد.'
        : left === 0 ? 'اشتراک امروز تمام می‌شود.' : `${fa(left)} روز از امروز`;
      html = `<div class="summary"><span>اشتراک تا <b>${shortDate(target)}</b></span><span class="muted" style="font-size:13px">${note}</span></div>`;
    }
    $('#subPreview').innerHTML = html;
    $('#subSave').disabled = !target || target === sub.expiresAt;
  };

  form.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-days]');
    if (!b) return;
    $('#subDays').value = '';
    target = addDays(base, Number(b.dataset.days));
    setSelects(target);
    update();
  });
  $('#subDays').addEventListener('input', () => {
    const n = parseInt(toEn($('#subDays').value), 10);
    if (n > 0 && n <= 3650) { target = addDays(base, n); setSelects(target); }
    update();
  });
  ['#subD', '#subM', '#subY'].forEach((sel) => $(sel).addEventListener('change', () => {
    $('#subDays').value = '';
    target = fromJalali(Number($('#subY').value), Number($('#subM').value), Number($('#subD').value));
    update();
  }));

  $('#subSave').addEventListener('click', async () => {
    if (!target) return;
    $('#subSave').disabled = true;
    try {
      await api('PUT', `/admin/shops/${encodeURIComponent(shop.id)}/subscription`, { expiresAt: target });
      closeModal();
      toast(`اشتراک تا ${shortDate(target)} ثبت شد`);
      render();
    } catch (err) {
      toast(err.message, true);
      $('#subSave').disabled = false;
    }
  });
  update();
}

/* ================================================================ admin view */
function renderAdmin() {
  renderTopbar('admin');
  const { barbers } = state.admin;
  const tabs = `
    <div class="seg" role="tablist">
      <button class="${state.tab === 'schedule' ? 'active' : ''}" data-action="tab" data-tab="schedule">${icon('calendar')}نوبت‌ها</button>
      <button class="${state.tab === 'barbers' ? 'active' : ''}" data-action="tab" data-tab="barbers">${icon('users')}اطلاعات آرایشگاه</button>
    </div>`;

  if (!canManage()) state.tab = 'schedule';
  if (state.role === 'barber' && !barbers.length) {
    $('#app').innerHTML = `<div class="page"><div class="card">${emptyHTML('alert', 'پروفایل پیدا نشد', 'پروفایل آرایشگر شما حذف شده است. با مالک آرایشگاه تماس بگیرید.')}</div></div>`;
    return;
  }
  const body = canManage() && (state.tab === 'barbers' || !barbers.length) ? adminBarbersHTML() : adminScheduleHTML();
  $('#app').innerHTML = `
    <div class="page ${isReadOnly() ? 'readonly' : ''}">
      <div class="admin-head">
        <div class="hero" style="padding:0">
          <h1>${state.role === 'barber' ? 'نوبت‌های من' : 'پنل مدیریت'}</h1>
          <p>${state.role === 'barber' ? 'نوبت‌های خودتان را ثبت و مدیریت کنید' : state.tab === 'schedule' && barbers.length ? 'نوبت‌های روز را مدیریت کنید' : 'آرایشگرها، ساعت کاری و خدمات'}</p>
        </div>
        ${barbers.length && canManage() ? tabs : ''}
      </div>
      ${subBannerHTML()}
      ${state.shop?.active === false ? `<div class="alert alert-warn" style="margin-top:16px">${icon('alert')}<span>این آرایشگاه غیرفعال است؛ ثبت نوبت جدید ممکن نیست. نوبت‌های قبلی را می‌توانید ویرایش یا حذف کنید.</span></div>` : ''}
      ${body}
    </div>`;
  scrollActiveDay();
}

function adminScheduleHTML() {
  const { barbers, appointments } = state.admin;
  const b = currentBarber(barbers);
  const pastDay = state.date < todayISO();
  const plan = dayPlan(b, state.date, appointments, { fromNow: true });
  if (pastDay) plan.gaps = [];
  const booked = plan.list.reduce((s, a) => s + toMin(a.end) - toMin(a.start), 0);
  const free = plan.gaps.reduce((s, [x, y]) => s + y - x, 0);
  const isToday = state.date === todayISO();
  const now = nowMin();

  // غیرفعال، روز گذشته یا مهلت پایان اشتراک (فقط مشاهده): ثبت نوبت جدید ممکن نیست
  const locked = state.shop?.active === false || pastDay || isReadOnly();

  // ترکیب نوبت‌ها و بازه‌های خالی به ترتیب زمان
  const items = [
    ...plan.list.map((a) => ({ t: toMin(a.start), html: apptHTML(a, plan, isToday && toMin(a.end) <= now || state.date < todayISO()) })),
    ...plan.gaps.map(([s, e]) => ({
      t: s, html: locked ? `
      <div class="gap locked">
        <span class="g-info">${icon('clock')} ${faTime(s)} تا ${faTime(e)} <small>${fmtDur(e - s)} خالی</small></span>
      </div>` : `
      <button class="gap" data-action="new-appt" data-start="${fromMin(s)}">
        <span class="g-info">${icon('clock')} ${faTime(s)} تا ${faTime(e)} <small>${fmtDur(e - s)} خالی</small></span>
        <span class="g-add">${icon('plus')}<span class="btn-label-sm">ثبت نوبت</span></span>
      </button>` })),
  ].sort((a, b2) => a.t - b2.t);

  let agenda;
  if (items.length) agenda = `<div class="agenda">${items.map((i) => i.html).join('')}</div>`;
  else if (plan.closed) agenda = `<div class="card">${emptyHTML('coffee', 'روز تعطیل', `${esc(b.name)} در این روز کار نمی‌کند. ${locked ? '' : ' در صورت نیاز همچنان می‌توانید نوبت ثبت کنید.'}`, locked ? '' : `<button class="btn btn-primary" data-action="new-appt">${icon('plus')}ثبت نوبت</button>`)}</div>`;
  else if (pastDay) agenda = `<div class="card">${emptyHTML('calendar', 'این روز گذشته است', 'برای این روز نوبتی ثبت نشده بود.')}</div>`;
  else if (isToday && now >= plan.close) agenda = `<div class="card">${emptyHTML('calendar', 'ساعت کاری امروز تمام شده است', 'برای امروز زمان خالی دیگری باقی نمانده است.')}</div>`;
  else agenda = `<div class="card">${emptyHTML('calendar', 'روز کاملاً پر است', 'زمان خالی در ساعت کاری باقی نمانده است.')}</div>`;

  return `
    ${state.role === 'barber' ? '' : `<div class="section-title"><span>آرایشگر</span></div>
    <div class="chips-scroll">
      ${barbers.map((x) => `<button class="pick ${x.id === b.id ? 'active' : ''}" data-action="pick-barber" data-id="${x.id}">${avatar(x, 26)}${esc(x.name)}</button>`).join('')}
    </div>`}

    <div class="section-title">
      <span>${longDate(state.date)}</span>
      <div class="strip-nav">
        <button class="btn icon-btn sm" data-action="strip" data-dir="-1" title="هفتهٔ قبل">${icon('right')}</button>
        <button class="btn" style="padding:6px 14px" data-action="today">امروز</button>
        <button class="btn icon-btn sm" data-action="strip" data-dir="1" title="هفتهٔ بعد">${icon('left')}</button>
      </div>
    </div>
    ${dateStripHTML(b, appointments, { from: state.stripStart, days: 14, admin: true })}

    <div class="stats">
      <div class="card stat"><div class="k">تعداد نوبت</div><div class="v">${fa(plan.list.length)}</div></div>
      <div class="card stat"><div class="k">زمان رزرو شده</div><div class="v" style="font-size:15px">${booked ? fmtDur(booked) : '—'}</div></div>
      <div class="card stat"><div class="k">زمان خالی</div><div class="v" style="font-size:15px;color:var(--free)">${plan.closed ? 'تعطیل' : free ? fmtDur(free) : '—'}</div></div>
    </div>

    ${!plan.closed ? `<div class="card" style="margin-top:12px;padding:14px 16px">${timelineHTML(plan)}</div>` : ''}

    <div class="section-title"><span>برنامهٔ روز</span><span class="muted">${plan.closed ? '' : `ساعت کاری ${faTime(plan.open)} تا ${faTime(plan.close)}`}</span></div>
    ${agenda}

    ${locked ? '' : `<button class="btn btn-primary fab" data-action="new-appt">${icon('plus')}نوبت جدید</button>`}`;
}

function apptHTML(a, plan, past) {
  const outside = plan.closed || toMin(a.start) < plan.open || toMin(a.end) > plan.close;
  return `
    <div class="appt ${past ? 'past' : ''} ${outside ? 'outside' : ''}">
      <div class="time">${faTime(a.start)}<small>تا ${faTime(a.end)}</small></div>
      <div class="body">
        <div class="who">${esc(a.customerName)}
          ${a.customerPhone ? `<a class="phone" href="tel:${esc(a.customerPhone)}">${icon('phone')}<span class="ltr">${fa(esc(a.customerPhone))}</span></a>` : ''}
        </div>
        <div class="service-list">${a.services.map((s) => `<span class="tag">${esc(s.name)}</span>`).join('')}
          <span class="tag muted">${fmtDur(toMin(a.end) - toMin(a.start))}</span>
          ${outside ? `<span class="tag" style="color:var(--warn)">خارج از ساعت کاری</span>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="btn icon-btn sm" data-action="edit-appt" data-id="${a.id}" title="ویرایش">${icon('edit')}</button>
        <button class="btn icon-btn sm btn-danger" data-action="del-appt" data-id="${a.id}" title="حذف">${icon('trash')}</button>
      </div>
    </div>`;
}

function hoursSummary(b) {
  const on = WEEK.filter(([k]) => b.hours[k]?.on);
  if (!on.length) return 'بدون روز کاری';
  const first = b.hours[on[0][0]];
  const same = on.every(([k]) => b.hours[k].start === first.start && b.hours[k].end === first.end);
  const days = on.length === 7 ? 'همه روزه' : on.length === 6 && !b.hours['5'].on ? 'شنبه تا پنجشنبه' : `${fa(on.length)} روز در هفته`;
  return same ? `${days} · ${faTime(first.start)} تا ${faTime(first.end)}` : days;
}

// مالک می‌تواند خودش را هم به‌عنوان آرایشگر اضافه کند
function ownerBarberHTML() {
  const me = state.role === 'owner';
  const ob = state.admin.barbers.find((b) => b.owner);
  if (ob) {
    return `
      <div class="section-title"><span>مالک هم آرایشگر است</span></div>
      <div class="card barber-row">
        <div class="info">
          <div class="name" style="font-size:15px">${me ? 'شما' : 'مالک'} با نام «${esc(ob.name)}» در لیست آرایشگرها هستید</div>
          <div class="hint muted" style="font-size:13px">ساعت کاری و خدمات را از دکمهٔ ویرایش همان کارت تنظیم کنید.</div>
        </div>
        <div class="row" style="flex-wrap:wrap">
          <button class="btn" data-action="edit-barber" data-id="${ob.id}">${icon('edit')}ویرایش</button>
          <button class="btn btn-danger" data-action="del-barber" data-id="${ob.id}">${icon('trash')}حذف از آرایشگرها</button>
        </div>
      </div>`;
  }
  return `
    <div class="section-title"><span>مالک هم آرایشگر است؟</span></div>
    <form class="card" id="ownerBarberForm">
      <p class="muted" style="margin:0 0 14px;font-size:13.5px">اگر ${me ? 'خودتان' : 'مالک'} هم آرایشگری می‌کند، نام و شماره را وارد کنید تا به لیست آرایشگرها اضافه شود. ساعت کاری و خدمات را بعداً می‌توانید ویرایش کنید.</p>
      <div class="row cred-row">
        <div class="field">
          <label for="obName">نام</label>
          <input class="input" id="obName" maxlength="40" required placeholder="${me ? 'نام شما' : 'نام مالک'}">
        </div>
        <div class="field">
          <label for="obPhone">شماره تماس</label>
          <input class="input ltr-input" id="obPhone" type="tel" inputmode="tel" maxlength="20" required placeholder="۰۹۱۲۰۰۰۰۰۰۰">
        </div>
      </div>
      <button class="btn btn-primary">${icon('plus')}${me ? 'اضافه کردن خودم به آرایشگرها' : 'اضافه کردن مالک به آرایشگرها'}</button>
    </form>`;
}

function adminBarbersHTML() {
  const { barbers } = state.admin;
  const list = barbers.length
    ? `<div class="barber-cards">${barbers.map((b) => `
        <div class="card barber-row">
          ${avatar(b, 52)}
          <div class="info">
            <div class="name">${esc(b.name)}${b.owner ? ' <span class="badge badge-owner">مالک</span>' : ''}</div>
            <div class="meta">
              <span>${icon('phone')}<span class="ltr">${fa(esc(b.phone))}</span></span>
              <span>${icon('clock')}${hoursSummary(b)}</span>
              <span>${icon('list')}${fa(b.services.length)} خدمت</span>
              <span>${icon('lock')}${b.owner ? 'ورود با حساب مالک' : state.accounts?.barbers?.[b.id] ? `<span class="ltr">${esc(state.accounts.barbers[b.id])}</span>` : 'بدون حساب کاربری'}</span>
            </div>
          </div>
          <div class="row">
            <button class="btn" data-action="edit-barber" data-id="${b.id}">${icon('edit')}ویرایش</button>
            <button class="btn icon-btn btn-danger" data-action="del-barber" data-id="${b.id}" title="حذف">${icon('trash')}</button>
          </div>
        </div>`).join('')}</div>`
    : `<div class="card">${emptyHTML('scissors', 'اولین آرایشگر را اضافه کنید', 'برای شروع نوبت‌دهی، پروفایل آرایشگر را با ساعت کاری و خدمات بسازید.', `<button class="btn btn-primary btn-lg" data-action="new-barber">${icon('plus')}افزودن آرایشگر</button>`)}</div>`;

  return `
    <div class="section-title">
      <span>آرایشگرها</span>
      ${barbers.length ? `<button class="btn btn-primary" data-action="new-barber">${icon('plus')}افزودن آرایشگر</button>` : ''}
    </div>
    ${list}

    ${ownerBarberHTML()}

    <div class="section-title"><span>اطلاعات آرایشگاه</span></div>
    <form class="card" id="settingsForm">
      <div class="field">
        <label for="shopInput">نام آرایشگاه</label>
        <input class="input" id="shopInput" value="${esc(state.shop.name)}" maxlength="60" required>
      </div>
      <div class="field">
        <label for="locInput">لوکیشن</label>
        <textarea class="input" id="locInput" rows="2" maxlength="300" required placeholder="آدرس یا لینک نقشه">${esc(state.shop.location)}</textarea>
      </div>
      ${socialFieldsHTML('own', state.shop)}
      ${credFieldsHTML('own', state.accounts?.owner || '', !state.accounts?.owner, 'حساب مالک')}
      <button class="btn btn-primary">${icon('check')}ذخیره</button>
    </form>

    <div class="section-title"><span>نسخهٔ پشتیبان</span></div>
    <div class="card barber-row">
      <div class="info">
        <div class="name" style="font-size:15px">اطلاعات آنلاین ذخیره می‌شود</div>
        <div class="hint muted" style="font-size:13px">همهٔ دستگاه‌ها اطلاعات یکسان می‌بینند. هر از گاهی یک نسخهٔ پشتیبان دانلود کنید.</div>
      </div>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn btn-primary" data-action="export">${icon('check')}دانلود پشتیبان</button>
        <label class="btn">${icon('plus')}بازیابی از فایل<input type="file" accept=".json,application/json" id="importFile" hidden></label>
      </div>
    </div>`;
}

/* ================================================================ time picker */
function timePickHTML(name, value, { step = 5, disabled = false } = {}) {
  const [h, m] = (value || '10:00').split(':').map(Number);
  const mm = Math.round(m / step) * step % 60;
  let hours = '', mins = '';
  for (let i = 0; i <= 23; i++) hours += `<option value="${i}" ${i === h ? 'selected' : ''}>${fa(pad(i))}</option>`;
  for (let i = 0; i < 60; i += step) mins += `<option value="${i}" ${i === mm ? 'selected' : ''}>${fa(pad(i))}</option>`;
  return `<span class="time-pick" data-time="${name}">
    <select data-part="h" ${disabled ? 'disabled' : ''} aria-label="ساعت">${hours}</select><b>:</b>
    <select data-part="m" ${disabled ? 'disabled' : ''} aria-label="دقیقه">${mins}</select>
  </span>`;
}
function readTime(root, name) {
  const el = $(`[data-time="${name}"]`, root);
  return `${pad($('[data-part="h"]', el).value)}:${pad($('[data-part="m"]', el).value)}`;
}
function setTime(root, name, value) {
  const el = $(`[data-time="${name}"]`, root);
  const [h, m] = value.split(':').map(Number);
  $('[data-part="h"]', el).value = String(h);
  $('[data-part="m"]', el).value = String(Math.round(m / 5) * 5 % 60);
}

/* ================================================================ appointment modal */
function openApptModal(appt, presetStart) {
  if (!appt && state.shop?.active === false) { toast('این آرایشگاه غیرفعال است و نوبت جدید ثبت نمی‌شود', true); return; }
  if (isReadOnly()) { toast('اشتراک تمام شده و پنل فقط قابل مشاهده است', true); return; }
  if (!appt && state.date < todayISO()) { toast('ثبت نوبت برای روزهای گذشته ممکن نیست', true); return; }
  const { barbers, appointments } = state.admin;
  const b = barbers.find((x) => x.id === (appt?.barberId || state.barberId));
  if (!b) return;
  if (!b.services.length) {
    toast('ابتدا برای این آرایشگر خدمات تعریف کنید', true);
    openBarberModal(b);
    return;
  }
  const date = appt?.date || state.date;
  const plan = dayPlan(b, date, appointments.filter((a) => a.id !== appt?.id), { fromNow: true });
  if (date < todayISO()) plan.gaps = [];
  const selected = new Set(appt ? appt.services.map((s) => s.id).filter((id) => b.services.some((s) => s.id === id)) : []);
  let start = appt?.start || presetStart;
  if (!start) {
    const nowRounded = Math.ceil(nowMin() / 5) * 5;
    const gap = plan.gaps.find(([, e]) => date !== todayISO() || e > nowRounded);
    start = gap ? fromMin(date === todayISO() ? Math.max(gap[0], Math.min(nowRounded, gap[1] - 5)) : gap[0]) : fromMin(plan.open || 600);
  }

  openModal(`
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>${appt ? 'ویرایش نوبت' : 'نوبت جدید'}</h2>
        <button class="btn btn-ghost icon-btn sm" data-action="close" aria-label="بستن">${icon('x')}</button>
      </div>
      <form class="modal-body" id="apptForm" autocomplete="off">
        <div class="tag" style="margin-bottom:16px">${avatar(b, 22)} ${esc(b.name)} · ${longDate(date)}</div>

        <div class="field">
          <label>خدمات <span class="muted" style="font-weight:400">— با یک کلیک انتخاب کنید</span></label>
          <div class="pick-chips" id="svcPicks">
            ${b.services.map((s) => `
              <button type="button" class="pick ${selected.has(s.id) ? 'active' : ''}" data-sid="${s.id}">
                <span class="check">${icon('check')}</span>${esc(s.name)} <small>${fmtDur(s.minutes)}</small>
              </button>`).join('')}
          </div>
        </div>

        <div class="field">
          <label>ساعت شروع</label>
          <div class="row" style="flex-wrap:wrap">
            ${timePickHTML('start', start)}
            ${plan.gaps.length ? `<span class="muted" style="font-size:12.5px">پیشنهاد:</span>
              ${plan.gaps.slice(0, 6).map(([s]) => `<button type="button" class="pick mini" data-quick="${fromMin(s)}">${faTime(s)}</button>`).join('')}` : ''}
          </div>
        </div>

        <div id="apptSummary"></div>

        <div class="field">
          <label for="cName">نام مشتری</label>
          <input class="input" id="cName" required maxlength="60" value="${esc(appt?.customerName || '')}" placeholder="مثلاً علی محمدی">
        </div>
        <div class="field">
          <label for="cPhone">شماره تماس <span class="muted" style="font-weight:400">(اختیاری)</span></label>
          <input class="input ltr-input" id="cPhone" type="tel" inputmode="tel" maxlength="20" value="${esc(appt?.customerPhone || '')}" placeholder="۰۹۱۲۰۰۰۰۰۰۰">
        </div>
      </form>
      <div class="modal-foot">
        <button class="btn btn-primary btn-lg" id="apptSave">${icon('check')}${appt ? 'ذخیرهٔ تغییرات' : 'ثبت نوبت'}</button>
        <button class="btn btn-lg" data-action="close">انصراف</button>
      </div>
    </div>`);

  const form = $('#apptForm');
  const update = () => {
    const total = b.services.filter((s) => selected.has(s.id)).reduce((t, s) => t + s.minutes, 0);
    const s = toMin(readTime(form, 'start'));
    const e = s + total;
    const conflict = total && plan.list.find((a) => s < toMin(a.end) && toMin(a.start) < e);
    const outside = total && (plan.closed || s < plan.open || e > plan.close);
    // نوبت جدید یا جابه‌جا شده نباید در گذشته باشد (۵ دقیقه تأخیر مجاز)
    const moved = !appt || fromMin(s) !== appt.start;
    const past = moved && (date < todayISO() || (date === todayISO() && s < nowMin() - 5));
    let html = '';
    if (total) {
      html += `<div class="summary">
        <span>مدت: <b>${fmtDur(total)}</b></span>
        <span>${faTime(s)} ← <b>${e > 1440 ? '—' : faTime(e)}</b></span>
      </div>`;
    } else {
      html += `<div class="summary"><span class="muted">حداقل یک خدمت انتخاب کنید تا زمان پایان محاسبه شود</span></div>`;
    }
    if (past) html += `<div class="alert alert-busy">${icon('alert')}<span>این ساعت گذشته است؛ ساعت دیگری انتخاب کنید.</span></div>`;
    else if (e > 1440) html += `<div class="alert alert-busy">${icon('alert')}<span>زمان پایان از نیمه‌شب می‌گذرد.</span></div>`;
    else if (conflict) html += `<div class="alert alert-busy">${icon('alert')}<span>با نوبت «${esc(conflict.customerName)}» (${faTime(conflict.start)} تا ${faTime(conflict.end)}) تداخل دارد.</span></div>`;
    else if (outside) html += `<div class="alert alert-warn">${icon('alert')}<span>${plan.closed ? 'این روز تعطیل است.' : `خارج از ساعت کاری (${faTime(plan.open)} تا ${faTime(plan.close)}) است.`} ثبت امکان‌پذیر است.</span></div>`;
    $('#apptSummary').innerHTML = html;
    $('#apptSave').disabled = !total || !!conflict || e > 1440 || past;
    $$('[data-quick]', form).forEach((q) => q.classList.toggle('active', q.dataset.quick === fromMin(s)));
  };

  $('#svcPicks').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-sid]');
    if (!btn) return;
    const id = btn.dataset.sid;
    selected.has(id) ? selected.delete(id) : selected.add(id);
    btn.classList.toggle('active', selected.has(id));
    update();
  });
  form.addEventListener('click', (ev) => {
    const q = ev.target.closest('[data-quick]');
    if (q) { setTime(form, 'start', q.dataset.quick); update(); }
  });
  form.addEventListener('change', update);
  form.addEventListener('submit', (ev) => { ev.preventDefault(); $('#apptSave').click(); });

  $('#apptSave').addEventListener('click', async () => {
    const name = $('#cName').value.trim();
    if (!name) { $('#cName').focus(); toast('نام مشتری را وارد کنید', true); return; }
    const payload = {
      barberId: b.id,
      date,
      start: readTime(form, 'start'),
      serviceIds: [...selected],
      customerName: name,
      customerPhone: toEn($('#cPhone').value),
    };
    $('#apptSave').disabled = true;
    try {
      await mutate((data) => applyAppointment(data, payload, appt?.id));
      closeModal();
      toast(appt ? 'نوبت ویرایش شد' : 'نوبت ثبت شد');
      renderAdmin();
    } catch (err) {
      toast(err.message, true);
      update();
    }
  });

  update();
  if (!appt) setTimeout(() => (selected.size ? $('#cName') : null)?.focus(), 60);
}

/* ================================================================ barber modal */
function openBarberModal(barber) {
  const b = barber || defaultBarber();
  const isOwner = !!barber?.owner;

  const account = barber ? state.accounts?.barbers?.[barber.id] || '' : '';

  const svcRow = (s = {}) => `
    <div class="svc-row" data-svc="${esc(s.id || '')}">
      <input class="input" data-f="name" placeholder="نام خدمت (مثلاً رنگ مو)" value="${esc(s.name || '')}" maxlength="40">
      <div class="min-wrap"><input class="input" data-f="minutes" inputmode="numeric" value="${s.minutes ? fa(s.minutes) : ''}" placeholder="۳۰"><small>دقیقه</small></div>
      <button type="button" class="btn icon-btn sm btn-danger" data-rm title="حذف">${icon('trash')}</button>
    </div>`;

  openModal(`
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h2>${barber ? 'ویرایش آرایشگر' : 'آرایشگر جدید'}</h2>
        <button class="btn btn-ghost icon-btn sm" data-action="close" aria-label="بستن">${icon('x')}</button>
      </div>
      <form class="modal-body" id="barberForm" autocomplete="off">
        <div class="field">
          <label for="bName">نام آرایشگر</label>
          <input class="input" id="bName" required maxlength="40" value="${esc(b.name)}" placeholder="مثلاً استاد رضا">
        </div>
        <div class="field">
          <label for="bPhone">شماره تماس</label>
          <input class="input ltr-input" id="bPhone" type="tel" inputmode="tel" required maxlength="20" value="${esc(fa(b.phone))}" placeholder="۰۹۱۲۰۰۰۰۰۰۰">
          <span class="hint">این شماره برای رزرو تلفنی به مشتری‌ها نمایش داده می‌شود.</span>
        </div>

        ${isOwner ? `<div class="alert alert-warn" style="background:var(--accent-soft);color:var(--accent)">${icon('user')}<span>این پروفایل مالک آرایشگاه است و با حساب مالک وارد می‌شود.</span></div>` : credFieldsHTML('bc', account, !account, 'حساب کاربری آرایشگر (اختیاری)')}

        <div class="field">
          <div class="row" style="justify-content:space-between">
            <span class="label">ساعت کاری هفتگی</span>
            <button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:12.5px" id="copyHours">اعمال شنبه به همه روزها</button>
          </div>
          <div class="hours-table">
            ${WEEK.map(([k, label]) => {
    const h = b.hours[k] || { on: false, start: '10:00', end: '20:00' };
    return `<div class="hours-row ${h.on ? '' : 'off'}" data-day="${k}">
                <label class="switch"><input type="checkbox" ${h.on ? 'checked' : ''}><span></span></label>
                <span class="dname">${label}</span>
                ${timePickHTML('s' + k, h.start)}<span class="sep">تا</span>${timePickHTML('e' + k, h.end)}
              </div>`;
  }).join('')}
          </div>
        </div>

        <div class="field">
          <span class="label">خدمات قابل ارائه</span>
          <span class="hint">هر خدمت با زمان موردنیاز؛ هنگام ثبت نوبت با یک کلیک انتخاب می‌شود و زمان پایان خودکار محاسبه می‌گردد.</span>
          <div class="svc-rows" id="svcRows">${b.services.map(svcRow).join('')}</div>
          <button type="button" class="btn" id="addSvc" style="align-self:flex-start;margin-top:4px">${icon('plus')}افزودن خدمت</button>
        </div>
      </form>
      <div class="modal-foot">
        <button class="btn btn-primary btn-lg" id="barberSave">${icon('check')}${barber ? 'ذخیرهٔ تغییرات' : 'افزودن آرایشگر'}</button>
        <button class="btn btn-lg" data-action="close">انصراف</button>
      </div>
    </div>`);

  const form = $('#barberForm');
  form.addEventListener('change', (ev) => {
    const row = ev.target.closest('.hours-row');
    if (row && ev.target.type === 'checkbox') row.classList.toggle('off', !ev.target.checked);
  });
  form.addEventListener('click', (ev) => {
    const rm = ev.target.closest('[data-rm]');
    if (rm) rm.closest('.svc-row').remove();
  });
  $('#addSvc').addEventListener('click', () => {
    $('#svcRows').insertAdjacentHTML('beforeend', svcRow());
    $('#svcRows .svc-row:last-child input').focus();
  });
  $('#copyHours').addEventListener('click', () => {
    const s = readTime(form, 's6'), e = readTime(form, 'e6');
    WEEK.forEach(([k]) => { setTime(form, 's' + k, s); setTime(form, 'e' + k, e); });
    toast('ساعت شنبه برای همه روزها اعمال شد');
  });
  form.addEventListener('submit', (ev) => { ev.preventDefault(); $('#barberSave').click(); });

  $('#barberSave').addEventListener('click', async () => {
    const payload = {
      name: $('#bName').value.trim(),
      phone: toEn($('#bPhone').value),
      hours: Object.fromEntries(WEEK.map(([k]) => [k, {
        on: $(`.hours-row[data-day="${k}"] input[type=checkbox]`, form).checked,
        start: readTime(form, 's' + k),
        end: readTime(form, 'e' + k),
      }])),
      services: $$('.svc-row', form).map((r) => ({
        id: r.dataset.svc || undefined,
        name: $('[data-f="name"]', r).value.trim(),
        minutes: toEn($('[data-f="minutes"]', r).value),
      })).filter((s) => s.name),
    };
    if (!payload.name) { $('#bName').focus(); toast('نام آرایشگر را وارد کنید', true); return; }
    if (!payload.phone) { $('#bPhone').focus(); toast('شماره تماس را وارد کنید', true); return; }
    const username = isOwner ? '' : toEn($('#bcUser').value).toLowerCase();
    const password = isOwner ? '' : toEn($('#bcPass').value);
    if (username && !account && !password) { $('#bcPass').focus(); toast('برای حساب آرایشگر رمز عبور وارد کنید', true); return; }
    if (!username && password) { $('#bcUser').focus(); toast('نام کاربری آرایشگر را وارد کنید', true); return; }
    $('#barberSave').disabled = true;
    const id = barber?.id || newId();
    try {
      // اول حساب کاربری ساخته می‌شود تا تکراری بودن نام کاربری قبل از ذخیرهٔ آرایشگر مشخص شود
      if (username && (username !== account || password)) {
        await api('PUT', `${shopPath()}/accounts/${encodeURIComponent(id)}`, { username, password });
      } else if (!username && account && !isOwner) {
        await api('DELETE', `${shopPath()}/accounts/${encodeURIComponent(id)}`);
      }
      const saved = await mutate((data) => applyBarber(data, payload, id));
      await loadAdmin();
      if (!barber) { state.barberId = saved.id; store.set('hd_barber', saved.id); }
      closeModal();
      toast(barber ? 'تغییرات ذخیره شد' : 'آرایشگر اضافه شد');
      renderAdmin();
    } catch (err) {
      toast(err.message, true);
      $('#barberSave').disabled = false;
    }
  });
  if (!barber) setTimeout(() => $('#bName').focus(), 60);
}

/* ================================================================ confirm + modal plumbing */
function confirmDialog(title, text, okLabel = 'حذف') {
  return new Promise((resolve) => {
    openModal(`
      <div class="modal sm" role="dialog" aria-modal="true">
        <div class="modal-body" style="text-align:center;padding-top:24px">
          <div class="login-icon" style="background:var(--busy-soft);color:var(--busy)">${icon('trash')}</div>
          <h2 style="margin:0 0 6px;font-size:18px">${title}</h2>
          <p class="muted" style="margin:0">${text}</p>
        </div>
        <div class="modal-foot" style="border:0">
          <button class="btn btn-lg btn-danger" style="flex:1" id="cfOk">${okLabel}</button>
          <button class="btn btn-lg" style="flex:1" id="cfNo">انصراف</button>
        </div>
      </div>`, () => resolve(false));
    $('#cfOk').onclick = () => { closeModal(true); resolve(true); };
    $('#cfNo').onclick = () => { closeModal(); };
  });
}

let onModalClose = null;
function openModal(html, onClose) {
  onModalClose = onClose || null;
  $('#modalRoot').innerHTML = `<div class="overlay" data-overlay>${html}</div>`;
  document.body.style.overflow = 'hidden';
}
function closeModal(silent) {
  if (!silent && onModalClose) onModalClose();
  onModalClose = null;
  $('#modalRoot').innerHTML = '';
  document.body.style.overflow = '';
}
const modalOpen = () => !!$('#modalRoot').firstChild;

/* ================================================================ actions */
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  store.set('hd_theme', next);
  $('meta[name="theme-color"]').content = next === 'dark' ? '#0e0e14' : '#5b4ff5';
  render(false);
}

document.addEventListener('click', async (ev) => {
  if (ev.target.matches('[data-overlay]')) { closeModal(); return; }
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;

  switch (action) {
    case 'theme': return toggleTheme();
    case 'close': return closeModal();
    case 'admin':
      return goAdmin();
    case 'logout': {
      setAuth(null); state.admin = null; state.role = null; state.accounts = null;
      const r = route();
      if (r.view === 'admin') location.hash = `#/s/${encodeURIComponent(state.shopId)}`;
      else render();
      toast('از پنل مدیریت خارج شدید');
      return;
    }
    case 'open-shop':
      location.hash = `#/s/${encodeURIComponent(el.dataset.id)}`;
      return;
    case 'new-shop':
      return openShopModal(null);
    case 'edit-shop':
      return openShopModal(state.shops.find((x) => x.id === el.dataset.id));
    case 'home-tab':
      state.homeTab = el.dataset.tab;
      return render(false);
    case 'lead-status': {
      try {
        await api('PUT', `/admin/leads/${encodeURIComponent(el.dataset.id)}`, { status: el.dataset.status });
        const l = state.leads.find((x) => x.id === el.dataset.id);
        if (l) l.status = el.dataset.status;
        renderHome();
      } catch (err) { toast(err.message, true); }
      return;
    }
    case 'del-lead': {
      const l = state.leads.find((x) => x.id === el.dataset.id);
      if (!l || !(await confirmDialog('حذف درخواست', `درخواست «${esc(l.name)}» حذف شود؟`))) return;
      try {
        await api('DELETE', `/admin/leads/${encodeURIComponent(l.id)}`);
        state.leads = state.leads.filter((x) => x.id !== l.id);
        toast('درخواست حذف شد'); renderHome();
      } catch (err) { toast(err.message, true); }
      return;
    }
    case 'sub-shop':
      return openSubModal(state.shops.find((x) => x.id === el.dataset.id));
    case 'toggle-shop': {
      const sh = state.shops.find((x) => x.id === el.dataset.id);
      if (!sh) return;
      const activate = sh.active === false;
      if (!activate && !(await confirmDialog('غیرفعال کردن آرایشگاه',
        `«${esc(sh.name)}» از لیست عمومی پنهان می‌شود و مالک و آرایشگرهایش نمی‌توانند وارد شوند. اطلاعات حذف نمی‌شود و هر وقت بخواهید می‌توانید دوباره فعالش کنید.`, 'غیرفعال کن'))) return;
      try {
        await api('PUT', `/admin/shops/${encodeURIComponent(sh.id)}/status`, { active: activate });
        toast(activate ? 'آرایشگاه فعال شد' : 'آرایشگاه غیرفعال شد');
        render();
      } catch (err) { toast(err.message, true); }
      return;
    }
    case 'del-shop': {
      const sh = state.shops.find((x) => x.id === el.dataset.id);
      if (!sh || !(await confirmDialog('حذف آرایشگاه', `آرایشگاه «${esc(sh.name)}» با همهٔ آرایشگرها، حساب‌ها و نوبت‌هایش برای همیشه حذف می‌شود. اگر فقط می‌خواهید موقتاً پنهان شود، غیرفعالش کنید.`))) return;
      try { await api('DELETE', `/admin/shops/${encodeURIComponent(sh.id)}`); toast('آرایشگاه حذف شد'); render(); }
      catch (err) { toast(err.message, true); }
      return;
    }
    case 'pick-barber':
      state.barberId = el.dataset.id; store.set('hd_barber', state.barberId);
      return render(false);
    case 'pick-date':
      state.date = el.dataset.date;
      return render(false);
    case 'strip':
      state.stripStart = addDays(state.stripStart, Number(el.dataset.dir) * 7);
      state.date = state.stripStart;
      return render(false);
    case 'today':
      state.date = todayISO(); state.stripStart = todayISO();
      return render(false);
    case 'tab':
      state.tab = el.dataset.tab;
      return render(false);
    case 'new-appt':
      return openApptModal(null, el.dataset.start);
    case 'edit-appt':
      return openApptModal(state.admin.appointments.find((a) => a.id === el.dataset.id));
    case 'del-appt': {
      const a = state.admin.appointments.find((x) => x.id === el.dataset.id);
      if (!a || !(await confirmDialog('حذف نوبت', `نوبت «${esc(a.customerName)}» ساعت ${faTime(a.start)} حذف شود؟`))) return;
      try {
        await mutate((data) => { data.appointments = data.appointments.filter((x) => x.id !== a.id); });
        toast('نوبت حذف شد'); renderAdmin();
      }
      catch (err) { toast(err.message, true); }
      return;
    }
    case 'export':
      return exportData();
    case 'new-barber':
      return openBarberModal(null);
    case 'edit-barber':
      return openBarberModal(state.admin.barbers.find((b) => b.id === el.dataset.id));
    case 'del-barber': {
      const b = state.admin.barbers.find((x) => x.id === el.dataset.id);
      if (!b || !(await confirmDialog('حذف آرایشگر', `پروفایل «${esc(b.name)}» و تمام نوبت‌های او حذف می‌شود. ادامه می‌دهید؟`))) return;
      try {
        await mutate((data) => {
          data.barbers = data.barbers.filter((x) => x.id !== b.id);
          data.appointments = data.appointments.filter((x) => x.barberId !== b.id);
        });
        toast('آرایشگر حذف شد'); renderAdmin();
      }
      catch (err) { toast(err.message, true); }
      return;
    }
  }
});

document.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'ownerBarberForm') return;
  ev.preventDefault();
  const btn = $('#ownerBarberForm button');
  btn.disabled = true;
  try {
    const body = { ...defaultBarber(), name: $('#obName').value.trim(), phone: toEn($('#obPhone').value) };
    if (!body.name) throw new AppError('نام را وارد کنید');
    if (!body.phone) throw new AppError('شماره تماس را وارد کنید');
    const saved = await mutate((data) => {
      if (data.barbers.some((b) => b.owner)) throw new AppError('مالک قبلاً به آرایشگرها اضافه شده است');
      const b = applyBarber(data, body, newId());
      b.owner = true;
      return b;
    });
    state.barberId = saved.id; store.set('hd_barber', saved.id);
    toast('به لیست آرایشگرها اضافه شد');
    renderAdmin();
  } catch (err) {
    btn.disabled = false;
    toast(err.message, true);
  }
});

document.addEventListener('submit', async (ev) => {
  if (ev.target.id !== 'settingsForm') return;
  ev.preventDefault();
  try {
    const ownerUsername = toEn($('#ownUser').value).toLowerCase();
    const ownerPassword = toEn($('#ownPass').value);
    const res = await api('PUT', `/admin/shops/${encodeURIComponent(state.shopId)}`,
      {
        name: $('#shopInput').value.trim(), location: $('#locInput').value.trim(),
        instagram: $('#ownIg').value.trim(), telegram: $('#ownTg').value.trim(), ownerUsername, ownerPassword
      });
    // اگر مالک اطلاعات ورود خودش را عوض کرد، با اطلاعات جدید دوباره وارد می‌شود
    if (state.auth?.role === 'owner' && (ownerPassword || ownerUsername !== state.accounts?.owner)) {
      if (ownerPassword) setAuth(await api('POST', `/shops/${encodeURIComponent(state.shopId)}/login`, { username: ownerUsername, password: ownerPassword }));
      else { setAuth(null); toast('نام کاربری تغییر کرد؛ دوباره وارد شوید'); location.hash = `#/s/${encodeURIComponent(state.shopId)}`; return; }
    }
    state.shop = { ...state.shop, ...res };
    await loadAdmin();
    toast('اطلاعات آرایشگاه ذخیره شد');
    renderAdmin();
  } catch (err) { toast(err.message, true); }
});

document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'importFile' || !ev.target.files[0]) return;
  const file = ev.target.files[0];
  ev.target.value = '';
  if (!(await confirmDialog('بازیابی از فایل', 'همهٔ اطلاعات فعلی با محتوای این فایل جایگزین می‌شود. ادامه می‌دهید؟', 'جایگزینی'))) return;
  try {
    await importData(file);
    toast('داده‌ها بارگذاری شد');
    renderAdmin();
  } catch (err) { toast(err.message, true); }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && modalOpen()) closeModal();
  if (ev.key === 'Enter' && ev.target.matches?.('.shop-card')) ev.target.click();
});

/* ================================================================ hidden admin entry */
// نگه داشتن آیکون قیچی به مدت ۲ ثانیه: در صفحهٔ آرایشگاه پنل همان آرایشگاه، در صفحهٔ اصلی ورود مدیر سایت
function goAdmin() {
  if (modalOpen()) return;
  const home = route().view === 'home' || route().view === 'join';
  const next = home ? '#/' : `#/s/${encodeURIComponent(state.shopId)}/admin`;
  const allowed = home ? isSuper() : canEnterShop(state.shopId);
  if (!allowed) return openLogin(next);
  if (location.hash !== next) location.hash = next;
  else if (home) toast('شما وارد شده‌اید');
}

(function setupLongPress() {
  const HOLD_MS = 2000;
  const target = $('.brand-icon');
  let timer = null, fired = false;
  const cancel = () => { clearTimeout(timer); timer = null; target.classList.remove('holding'); };
  target.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    fired = false;
    target.classList.add('holding');
    timer = setTimeout(() => {
      fired = true;
      cancel();
      if (navigator.vibrate) navigator.vibrate(40);
      goAdmin();
    }, HOLD_MS);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((e) => target.addEventListener(e, cancel));
  target.addEventListener('contextmenu', (ev) => ev.preventDefault());
  // بعد از نگه داشتن، کلیک لینک برند اجرا نشود
  $('.brand').addEventListener('click', (ev) => { if (fired) { ev.preventDefault(); fired = false; } });
})();

/* ================================================================ router */
// #/ لیست آرایشگاه‌ها · #/s/<id> نمای مشتری · #/s/<id>/admin پنل مدیریت
// دامنهٔ اختصاصی هر آرایشگاه: باز کردن این دامنه‌ها مستقیم صفحهٔ همان آرایشگاه را نشان می‌دهد
// و لیست آرایشگاه‌ها از آن‌ها در دسترس نیست
const DOMAIN_SHOPS = {
  'moghadamsbz.ir': '74260cf61a', // پیرایش مقدم
};
const domainShop = DOMAIN_SHOPS[location.hostname.replace(/^www\./, '')] || null;

function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 's' && parts[1]) return { view: parts[2] === 'admin' ? 'admin' : 'user', shopId: decodeURIComponent(parts[1]) };
  if (parts[0] === 'join') return { view: 'join', from: parts[1] ? decodeURIComponent(parts[1]) : null };
  // moghadamsbz.ir/admin → پنل همان آرایشگاه · آدرس اصلی/admin → ورود مدیر سایت
  const adminPath = /^\/admin\/?$/.test(location.pathname);
  if (domainShop) return { view: adminPath ? 'admin' : 'user', shopId: domainShop };
  return { view: 'home', adminEntry: adminPath };
}

async function render(reload = true) {
  const r = route();
  try {
    if (r.view === 'join') { renderJoin(r.from); return; }
    if (r.view === 'home') {
      if (reload || !state.shops) await loadShops();
      if (isSuper() && (reload || !state.leads)) state.leads = (await api('GET', '/admin/leads')).leads;
      renderHome();
      if (r.adminEntry && !isSuper() && !state.adminEntryShown) { state.adminEntryShown = true; openLogin('#/'); }
      return;
    }
    if (state.shopId !== r.shopId) { state.shopId = r.shopId; state.pub = null; state.admin = null; state.shop = null; }
    if (r.view === 'admin') {
      if (!canEnterShop(r.shopId)) { state.pendingLogin = true; location.hash = `#/s/${encodeURIComponent(r.shopId)}`; return; }
      if (reload || !state.admin) await loadAdmin();
      renderAdmin();
    } else {
      if (reload || !state.pub) await loadPublic();
      renderUser();
      if (state.pendingLogin) { state.pendingLogin = false; openLogin(`#/s/${encodeURIComponent(r.shopId)}/admin`); }
    }
  } catch (err) {
    if (err.expired && err.shopName) state.shop = { ...(state.shop || {}), name: err.shopName };
    renderTopbar(r.view);
    if (err.expired) { $('#app').innerHTML = expiredHTML(err.support, err.shopName); return; }
    const back = err.status === 404 || err.status === 403 ? '' : '<button class="btn btn-primary" onclick="render()">تلاش دوباره</button>';
    $('#app').innerHTML = `<div class="page"><div class="card">${emptyHTML(err.status === 403 ? 'lock' : 'alert', err.status === 404 ? 'آرایشگاه پیدا نشد' : err.status === 403 ? 'دسترسی ممکن نیست' : 'خطا در بارگذاری', esc(err.message), back)}</div></div>`;
  }
}

window.addEventListener('hashchange', () => {
  closeModal(true);
  state.date = todayISO();
  state.stripStart = todayISO();
  render();
});

// به‌روزرسانی خودکار هر ۳ دقیقه (وقتی پنجره‌ای باز نیست)
setInterval(() => {
  if (!modalOpen() && document.visibilityState === 'visible' && route().view !== 'join') render();
}, 3 * 60000);

$('.brand-icon').innerHTML = icon('scissors');
render();
