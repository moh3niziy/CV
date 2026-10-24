// شبیه‌ساز D1 روی node:sqlite برای تست‌های دود.
// فقط متدهایی را پیاده می‌کند که worker.js استفاده می‌کند: prepare/bind/first/all/run/batch.
// تراکنش واقعی نیست اما batch به‌شکل اتمیک اجرا می‌شود تا رفتار «یا همه یا هیچ» حفظ شود.

import { DatabaseSync } from 'node:sqlite';

export class MockD1 {
  constructor() {
    this.db = new DatabaseSync(':memory:');
  }

  prepare(sql) {
    const db = this.db;
    const stmt = {
      sql,
      args: [],
      bind(...values) {
        stmt.args = values.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v == null ? null : v));
        return stmt;
      },
      first: () => db.prepare(sql).get(...stmt.args) ?? null,
      all: () => ({ results: db.prepare(sql).all(...stmt.args) }),
      run: () => {
        const r = db.prepare(sql).run(...stmt.args);
        return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
      },
    };
    return stmt;
  }

  // آماده‌سازی همهٔ statement‌ها قبل از اجرا: اگر یکی نامعتبر باشد هیچ‌کدام اجرا نمی‌شود
  batch(stmts) {
    this.db.exec('BEGIN');
    try {
      const out = stmts.map((s) => {
        const r = this.db.prepare(s.sql).run(...s.args);
        return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
      });
      this.db.exec('COMMIT');
      return out;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  exec(sqlText) {
    this.db.exec(sqlText);
  }
}
