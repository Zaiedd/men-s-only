import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  images: {
    unoptimized: true,
  },
  // Turbopack's wasm shim (node/loadWasm.ts) resolves its runtime root with a
  // dynamic path, which makes the file trace glob ~57k files from the project
  // root. That drags the whole dev toolchain (wrangler, workerd, miniflare,
  // prisma CLI/studio, pglite) into the Worker bundle. None of it is reachable
  // from the Cloudflare runtime, so it is excluded from the trace.
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/wrangler/**",
      "./node_modules/miniflare/**",
      "./node_modules/workerd/**",
      "./node_modules/@cloudflare/workerd-windows-64/**",
      "./node_modules/@cloudflare/workerd-linux-64/**",
      "./node_modules/@miniflare/**",
      "./node_modules/prisma/**",
      "./node_modules/@prisma/engines/**",
      "./node_modules/@prisma/studio/**",
      "./node_modules/@prisma/studio-core/**",
      "./node_modules/@prisma/dev/**",
      "./node_modules/@prisma/config/**",
      "./node_modules/@prisma/get-platform/**",
      "./node_modules/@electric-sql/**",
      "./node_modules/pglite/**",
      "./node_modules/better-sqlite3/**",
      "./node_modules/eslint/**",
      "./node_modules/@eslint/**",
      "./node_modules/eslint-config-next/**",
      "./node_modules/typescript/**",
      "./node_modules/@types/**",
    ],
  },
};

export default nextConfig;

// The dev proxy pulls wrangler/miniflare/workerd into the module graph. Load it
// through a dynamic import so production builds never touch it.
if (process.env.NODE_ENV !== "production") {
  void import("@opennextjs/cloudflare").then((m) =>
    m.initOpenNextCloudflareForDev(),
  );
}
