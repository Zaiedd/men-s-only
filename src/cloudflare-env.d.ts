import type { D1Database } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    /** Prisma D1 database binding */
    DB?: D1Database;
  }
}

export {};