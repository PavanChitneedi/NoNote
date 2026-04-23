import { query } from "../db/pool.js";

export async function appLog(level, category, message, userId = null, meta = null) {
  try {
    await query(
      "INSERT INTO app_logs(level,category,message,user_id,meta) VALUES($1,$2,$3,$4,$5)",
      [level, category, message, userId || null, meta ? JSON.stringify(meta) : null]
    );
  } catch {} // never throw — logging must not break the app
}
