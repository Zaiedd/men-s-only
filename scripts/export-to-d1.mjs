import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const db = new Database("dev.db", { readonly: true });

const quote = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "bigint") return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  const s = String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${s.replace(/'/g, "''")}'`;
};

const out = [];
const insert = (table, rows) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  for (const r of rows) {
    out.push(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${cols
        .map((c) => quote(r[c]))
        .join(",")});`
    );
  }
  out.push("");
};

const tables = [
  "User",
  "Category",
  "Content",
  "SavedItem",
  "ChallengeProgress",
  "ChallengeDayProgress",
  "Activity",
];

const counts = {};
for (const t of tables) {
  const rows = db.prepare(`SELECT * FROM "${t}"`).all();
  counts[t] = rows.length;
  insert(t, rows);
}

writeFileSync("prisma/d1-data.sql", "PRAGMA foreign_keys=OFF;\n" + out.join("\n") + "\n");
console.log("exported", JSON.stringify(counts));
