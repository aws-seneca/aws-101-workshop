// Run with `npm test`. The PostgreSQL test runs only when TEST_DATABASE_URL is set,
// e.g. against a local Docker database:
//   docker run -d --rm --name pg -e POSTGRES_PASSWORD=pw -p 55432:5432 postgres:17-alpine
//   TEST_DATABASE_URL=postgres://postgres:pw@localhost:55432/postgres npm test
import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aws-101-"))
process.env.SIGNUPS_FILE = path.join(dir, "signups.json")
const { storage, storageLabel } = await import("../src/lib/storage.js")

async function roundTrip() {
  const store = storage()
  await store.add("Ada Builder", "ada@example.invalid")
  await store.add("Grace Hopper", "grace@example.invalid")
  const list = await store.list()
  assert.deepEqual(list.slice(0, 2).map((s) => s.name), ["Grace Hopper", "Ada Builder"], "newest first")
  assert.equal(typeof list[0].id, "string")
  assert.match(list[0].created_at, /^\d{4}-\d{2}-\d{2}T/)
  assert.equal(await store.remove(list[0].id), true)
  assert.equal(await store.remove(list[0].id), false)
  assert.ok(!(await store.list()).some((s) => s.id === list[0].id))
}

test("without DATABASE_URL, sign-ups go to a local JSON file", async () => {
  delete process.env.DATABASE_URL
  assert.equal(storageLabel(), "Local JSON")
  await roundTrip()
  assert.ok(fs.existsSync(process.env.SIGNUPS_FILE))
})

test("the label says RDS only for RDS hosts", () => {
  process.env.DATABASE_URL = "postgres://u:p@mydb.abc123.ca-central-1.rds.amazonaws.com:5432/postgres"
  assert.equal(storageLabel(), "RDS PostgreSQL")
  process.env.DATABASE_URL = "postgres://u:p@localhost:5432/postgres"
  assert.equal(storageLabel(), "PostgreSQL")
  delete process.env.DATABASE_URL
})

test("with DATABASE_URL, sign-ups go to PostgreSQL", { skip: !process.env.TEST_DATABASE_URL && "set TEST_DATABASE_URL" }, async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  await roundTrip()
  delete process.env.DATABASE_URL
})
