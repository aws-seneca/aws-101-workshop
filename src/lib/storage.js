// Where sign-ups are saved.
//
// No DATABASE_URL: a JSON file on this server's disk. It works, but the data
// dies with the instance and a second server could never see it.
// DATABASE_URL set (in .env): PostgreSQL, for example Amazon RDS.
//
// Both keep the same shape: { id, name, email, created_at }, newest first.

import fs from "node:fs/promises"
import { readFileSync } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

const DATA_FILE = process.env.SIGNUPS_FILE || path.join(process.cwd(), "signups.json")

// Amazon's public certificate bundle for RDS: lets the app verify it is really
// talking to RDS over TLS, which RDS for PostgreSQL requires.
const RDS_CA = path.join(process.cwd(), "certs", "rds-global-bundle.pem")

export function storageLabel() {
  const url = process.env.DATABASE_URL
  if (!url) return "Local JSON"
  return new URL(url).hostname.endsWith(".rds.amazonaws.com") ? "RDS PostgreSQL" : "PostgreSQL"
}

// ---- JSON file ------------------------------------------------------------

async function readFile() {
  try {
    return JSON.parse(await fs.readFile(/* turbopackIgnore: true */ DATA_FILE, "utf8"))
  } catch (err) {
    if (err.code === "ENOENT") return []
    throw err
  }
}

const jsonStore = {
  async list() {
    return (await readFile()).reverse()
  },
  async add(name, email) {
    const all = await readFile()
    all.push({ id: randomUUID(), name, email, created_at: new Date().toISOString() })
    await fs.writeFile(/* turbopackIgnore: true */ DATA_FILE, JSON.stringify(all, null, 2))
  },
  async remove(id) {
    const all = await readFile()
    const rest = all.filter((s) => s.id !== id)
    await fs.writeFile(/* turbopackIgnore: true */ DATA_FILE, JSON.stringify(rest, null, 2))
    return rest.length < all.length
  },
}

// ---- PostgreSQL -----------------------------------------------------------

// Connects once and creates the table on first use. A failed attempt is
// forgotten, so the next request tries again (for example after fixing .env).
let ready
function db() {
  ready ??= connect().catch((err) => {
    ready = undefined
    throw err
  })
  return ready
}

async function connect() {
  const { default: pg } = await import("pg")
  const url = process.env.DATABASE_URL
  const isRds = new URL(url).hostname.endsWith(".rds.amazonaws.com")
  const pool = new pg.Pool({
    connectionString: url,
    ssl: isRds ? { ca: readFileSync(/* turbopackIgnore: true */ RDS_CA, "utf8") } : false,
    connectionTimeoutMillis: 8000,
  })
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signups (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
  return pool
}

const postgresStore = {
  async list() {
    const { rows } = await (await db()).query(
      "SELECT id::text, name, email, created_at FROM signups ORDER BY created_at DESC, id DESC"
    )
    return rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() }))
  },
  async add(name, email) {
    // $1 and $2 are placeholders: user input never becomes part of the SQL text.
    await (await db()).query("INSERT INTO signups (name, email) VALUES ($1, $2)", [name, email])
  },
  async remove(id) {
    if (!/^\d+$/.test(id)) return false
    const { rowCount } = await (await db()).query("DELETE FROM signups WHERE id = $1", [id])
    return rowCount > 0
  },
}

export const storage = () => (process.env.DATABASE_URL ? postgresStore : jsonStore)
