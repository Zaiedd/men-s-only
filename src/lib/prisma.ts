import path from "node:path";
import { createRequire } from "node:module";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { SqlDriverAdapterFactory } from "@prisma/driver-adapter-utils";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isCloudflare(): boolean {
  const ua = (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent;
  return typeof ua === "string" && ua.includes("Cloudflare-Workers");
}

function cloudflareDBBinding(): D1Database | undefined {
  try {
    const ctx = getCloudflareContext({ async: false });
    return ctx.env.DB as D1Database | undefined;
  } catch {
    return undefined;
  }
}

function createClient() {
  const DB = cloudflareDBBinding();
  if (DB) {
    // Cloudflare Workers · D1
    return new PrismaClient({ adapter: new PrismaD1(DB) });
  }

  if (isCloudflare()) {
    throw new Error(
      "Cloudflare runtime detected but the D1 binding `DB` is unavailable. Check d1_databases in wrangler.jsonc."
    );
  }

  // Local development · SQLite via better-sqlite3.
  // Loaded through createRequire on purpose: the native addon must never be
  // pulled into the Workers bundle.
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const file = url.replace("file:", "");
  const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), file);
  const req = createRequire(/*turbopackIgnore: true*/ process.cwd() + "/package.json");
  const { PrismaBetterSqlite3 } = req("@prisma/adapter-better-sqlite3") as {
    PrismaBetterSqlite3: new (opts: { url: string }) => SqlDriverAdapterFactory;
  };
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
