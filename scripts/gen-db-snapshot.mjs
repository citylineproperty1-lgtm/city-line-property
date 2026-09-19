#!/usr/bin/env node
/**
 * Regenerate src/lib/db-snapshot.ts from the live SQLite database.
 *
 * Run this whenever the real database has meaningful new data that should be
 * baked into deployments from GitHub:
 *
 *   bun scripts/gen-db-snapshot.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const DB_PATH = new URL("../db/custom.db", import.meta.url);
const OUT_PATH = new URL("../src/lib/db-snapshot.ts", import.meta.url);

const b64 = readFileSync(DB_PATH).toString("base64");

const out = `/**
 * Embedded snapshot of db/custom.db (generated — do not edit by hand).
 * Regenerate with:  bun scripts/gen-db-snapshot.mjs
 *
 * LAST-RESORT data source for hosts where the SQLite file cannot be traced
 * into the serverless bundle (e.g. Vercel). Decoded to /tmp on cold start.
 */
export const DB_SNAPSHOT_BASE64 =
  "${b64}";
`;

writeFileSync(OUT_PATH, out);
console.log(`db-snapshot.ts written (${b64.length} base64 chars from db/custom.db)`);
