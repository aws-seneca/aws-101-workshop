// Where sign-ups are saved.
//
// Right now they go into a JSON file on this server's disk. That works, but it
// has real problems: the data is gone if the EC2 instance is terminated, two
// servers cannot share it, and nothing stops two writes from clashing.
//
// YOUR CHALLENGE: rewrite this file so sign-ups are saved to, and read from,
// your RDS PostgreSQL database instead. Keep the same four exports:
//   init(), addSignup(name, email), listSignups(), description
// and server.js will not need to change at all.
//
// Hints are in README.md under "The challenge".

const fs = require('fs/promises');
const path = require('path');

const FILE = path.join(__dirname, 'signups.json');

async function readAll() {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Run once when the app starts.
async function init() {
  const signups = await readAll();
  await fs.writeFile(FILE, JSON.stringify(signups, null, 2));
}

async function addSignup(name, email) {
  const signups = await readAll();
  signups.push({ name, email, created_at: new Date().toISOString() });
  await fs.writeFile(FILE, JSON.stringify(signups, null, 2));
}

// Newest first.
async function listSignups() {
  const signups = await readAll();
  return signups.reverse();
}

module.exports = {
  init,
  addSignup,
  listSignups,
  description: 'a local file on this server (signups.json)',
};
