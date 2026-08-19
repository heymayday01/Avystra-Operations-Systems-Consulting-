#!/usr/bin/env node
/**
 * Generate an Argon2id hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-admin-password.mjs 'your-new-password'
 *
 * Paste the printed hash into ADMIN_PASSWORD_HASH in .env (and in Vercel's
 * env vars for production). Never commit the plaintext password or the hash
 * to source control outside of your local/production env files.
 */
import { argon2id } from "hash-wasm";
import { randomBytes } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs '<password>'");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const hash = await argon2id({
  password,
  salt: randomBytes(16),
  parallelism: 1,
  iterations: 3,
  memorySize: 65536, // 64 MB
  hashLength: 32,
  outputType: "encoded",
});

// IMPORTANT: escape every `$` as `\$` when pasting into .env — Next.js's env
// loader (@next/env) treats unescaped `$word` sequences as variable
// expansion and will silently corrupt the hash otherwise.
const escaped = hash.replace(/\$/g, "\\$");
console.log("\nADMIN_PASSWORD_HASH=" + escaped + "\n");
