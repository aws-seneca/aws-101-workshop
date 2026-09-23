# AWS 101 sign-up app

A small Express app for the AWS 101 workshop, AWS Student Builder Group @ Seneca Polytechnic, October 7, 2026.

It shows a sign-up form and a table of everyone who signed up. Right now the sign-ups are saved to a file on the server. **Your challenge is to save them to an RDS PostgreSQL database instead.**

```
server.js   the web app: the form, the table, the routes. You do not need to change this.
store.js    where sign-ups are saved. This is the file you rewrite.
```

## Run it on your EC2 instance

Connect to your instance with **EC2 Instance Connect**, then:

```bash
sudo dnf install -y nodejs git
git clone https://github.com/aws-seneca/aws-101-workshop.git
cd aws-101-workshop
npm install
npm start
```

You should see `App running on port 3000`.

The app listens on port 3000, so your EC2 security group needs an inbound rule for it:

| Type | Port | Source |
|---|---|---|
| Custom TCP | 3000 | Anywhere (0.0.0.0/0) |

Then open `http://YOUR-PUBLIC-IP:3000` in your browser. Type the `http://` yourself, because the app has no HTTPS and some browsers try HTTPS first.

To keep the app running after you close the Instance Connect tab:

```bash
nohup npm start > app.log 2>&1 &
```

To stop it: `pkill -f "node server.js"`.

## Run it on your laptop

You need Node.js 18 or later.

```bash
npm install
npm start
```

Then open http://localhost:3000.

## The challenge: move the sign-ups into RDS

Sign up a few people, then look at the bottom of the page. It says the data is in `signups.json` on the server's disk. If the instance is terminated, the data goes with it, and a second server could never see it. That is why real apps keep data in a database.

**Goal:** sign-ups are saved to and read from your RDS PostgreSQL database. The bottom of the page should say RDS, and the data should survive even if you delete `signups.json`.

**Rules:** only change `store.js` (and install packages). Keep its four exports the same: `init()`, `addSignup(name, email)`, `listSignups()`, `description`.

### Hints, open one at a time

<details>
<summary>1. Let the EC2 instance reach the database</summary>

RDS blocks everything by default. The database's security group needs an inbound rule for **PostgreSQL, port 5432**, with your **EC2 instance's security group** as the source. Not 0.0.0.0/0.

When creating the database, the **Connectivity** section has a "Connect to an EC2 compute resource" option that sets this up for you.

</details>

<details>
<summary>2. Install the Postgres library and download the RDS certificate</summary>

On the EC2 instance, in the app folder:

```bash
npm install pg
curl -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

RDS for PostgreSQL 15 and later only accepts encrypted connections. The certificate bundle lets your app check it is really talking to RDS.

</details>

<details>
<summary>3. Give the app the connection details, without putting the password in code</summary>

```bash
export PGHOST=your-db.xxxxxxxx.ca-central-1.rds.amazonaws.com   # RDS console, Connectivity & security, Endpoint
export PGUSER=postgres
export PGPASSWORD='the password you set'
export PGDATABASE=postgres
```

The `pg` library reads these variables on its own.

</details>

<details>
<summary>4. What store.js needs to do</summary>

- Create a `Pool` from `pg`, passing `ssl: { ca: <the contents of global-bundle.pem> }`.
- In `init()`, run `CREATE TABLE IF NOT EXISTS signups (...)` with columns `id`, `name`, `email`, and `created_at`.
- In `addSignup`, run an `INSERT`. Use placeholders (`VALUES ($1, $2)`) and pass the values separately. Never glue user input into SQL.
- In `listSignups`, `SELECT` the rows newest first and return `result.rows`.

</details>

Restart the app after each change (`Ctrl+C`, then `npm start`).

## When you are done: tear it down

The database and the instance cost money while they exist. In the console, delete the RDS database (you can skip the final snapshot) and terminate the EC2 instance.
