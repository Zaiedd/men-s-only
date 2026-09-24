// ============================================================
//  MEN'S ONLY · database seed
//  Categories + admin user + full content pack (data/seed-parts).
//  Run: npm run db:seed
// ============================================================

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { CATEGORIES } from "../src/lib/site";
import { estimateReadingMinutes, payloadToText } from "../src/lib/payload";

const url = process.env.DATABASE_URL || "file:./dev.db";
const file = url.replace("file:", "");
const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), file);
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: `file:${dbPath}` }),
});

type SeedItem = {
  title: string;
  description: string;
  contentType: string;
  category: string;
  subcategory: string;
  tags: string[];
  difficulty: string;
  source?: string | null;
  featured: boolean;
  payload: unknown;
};

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

function loadSeedItems(): SeedItem[] {
  const partsDir = path.resolve(process.cwd(), "data", "seed-parts");
  const items: SeedItem[] = [];
  const files = fs
    .readdirSync(partsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  for (const f of files) {
    const batch = JSON.parse(fs.readFileSync(path.join(partsDir, f), "utf8")) as SeedItem[];
    items.push(...batch);
  }
  return items;
}

async function main() {
  // ---------- categories ----------
  console.log("Seeding categories…");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { key: c.key },
      create: {
        key: c.key,
        label: c.label,
        tagline: c.tagline,
        order: c.order,
        subcategories: JSON.stringify(c.subcategories),
      },
      update: {
        label: c.label,
        tagline: c.tagline,
        order: c.order,
        subcategories: JSON.stringify(c.subcategories),
      },
    });
  }
  const categoryByKey = new Map<string, string>(
    (await prisma.category.findMany()).map((c) => [c.key, c.id]),
  );

  // ---------- admin user ----------
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@mensonly.com").toLowerCase();
  const adminName = process.env.SEED_ADMIN_NAME || "Admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "MensOnly@2026!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: adminName, passwordHash, role: "ADMIN" as const },
    update: { role: "ADMIN" as const },
  });
  console.log(
    `Admin ready → ${adminEmail}  (password: ${envPasswordSource()})`,
  );

  // ---------- content ----------
  const items = loadSeedItems();
  console.log(`Seeding ${items.length} content items…`);

  const usedSlugs = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const categoryId = categoryByKey.get(item.category);
    if (!categoryId) {
      console.warn(`  ✗ unknown category "${item.category}" for "${item.title}" — skipped`);
      continue;
    }

    let slug = slugify(item.title);
    if (usedSlugs.has(slug)) {
      let n = 2;
      while (usedSlugs.has(`${slug}-${n}`)) n += 1;
      slug = `${slug}-${n}`;
    }
    usedSlugs.add(slug);

    const payloadRaw = JSON.stringify(item.payload);
    const searchText = [
      item.title,
      item.description,
      item.subcategory,
      item.tags.join(" "),
      payloadToText(item.contentType, payloadRaw),
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const now = new Date();
    const data = {
      title: item.title,
      slug,
      description: item.description,
      contentType: item.contentType as never,
      status: "PUBLISHED" as const,
      difficulty: item.difficulty as never,
      featured: item.featured,
      category: { connect: { id: categoryId } },
      subcategory: item.subcategory,
      tags: item.tags.join(","),
      searchText,
      source: item.source ?? null,
      readingTime: estimateReadingMinutes(item.contentType, payloadRaw),
      payload: payloadRaw,
      publishedAt: now,
      featuredAt: item.featured ? now : null,
    };

    const existing = await prisma.content.findUnique({ where: { slug } });
    if (existing) {
      await prisma.content.update({
        where: { slug },
        data: { ...data, status: "PUBLISHED" as const },
      });
      updated += 1;
    } else {
      await prisma.content.create({ data: { ...data, views: 0 } });
      created += 1;
    }
  }

  const counts = await prisma.content.groupBy({
    by: ["contentType"],
    _count: true,
  });
  console.log(`Done → ${created} created, ${updated} updated.`);
  for (const g of counts) {
    console.log(`  ${g.contentType}: ${g._count}`);
  }
  void admin;
}

function envPasswordSource(): string {
  return process.env.SEED_ADMIN_PASSWORD ? "from env" : "MensOnly@2026!";
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });