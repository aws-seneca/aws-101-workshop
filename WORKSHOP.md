# AWS 101 workshop: move a live app onto a managed database

You deploy a sign-up app to EC2, see why keeping data on the server is fragile, then move it to Amazon RDS. You change **no code**: one line of configuration does it.

```
Part 1:  Browser ──> EC2 (the app) ──> signups.json on the instance's disk
Part 3:  Browser ──> EC2 (the app) ──> RDS PostgreSQL in a private subnet
```

Use one region for everything, for example `ca-central-1` (Canada Central).

## Part 1. Run the app on EC2

1. EC2 console, **Launch instance**:
   - AMI: **Amazon Linux 2023**
   - Instance type: **t3.small** (the build needs 2 GB of memory; t3.micro is too small)
   - Security group: keep **Allow SSH traffic from Anywhere** (EC2 Instance Connect needs it), and add **Custom TCP, port 3000**, source **My IP**
2. Connect with **EC2 Instance Connect** and run:

   ```bash
   sudo dnf install -y nodejs22 nodejs22-npm git
   git clone https://github.com/aws-seneca/aws-101-workshop.git
   cd aws-101-workshop
   npm install
   npm run build
   npm start
   ```

   `npm install` and `npm run build` take a minute or two.
3. Open `http://YOUR-PUBLIC-IP:3000` (type `http://` yourself). Join the waitlist a few times, then open `/admin`.

The label in the top right of `/admin` says **Local JSON**: every sign-up is in `signups.json` on this one instance. Terminate the instance and they are gone; a second server would have its own file and disagree. Leave the app running.

## Part 2. Create the database

RDS console, **Create database**, **Standard create**:

| Setting | Choose | Why |
|---|---|---|
| Engine | **PostgreSQL** | |
| Templates | **Free tier** or the smallest option offered | |
| DB instance identifier | `aws-101-signups` | |
| Master username | `postgres` | |
| Credentials management | **Self managed**, and type a password of **letters and numbers only** | It goes inside a URL in Part 3; symbols like `@ : / #` would break it |
| Connectivity | **Connect to an EC2 compute resource**, then pick your instance | AWS creates a pair of security groups so only your instance can reach the database on port 5432, and keeps the database in a private subnet |

Choose **Create database** and wait until the status is **Available** (a few minutes). Then open the database and copy its **Endpoint** from **Connectivity & security**.

## Part 3. Point the app at RDS

In the terminal, stop the app (`Ctrl+C`), then write one line, with your password and endpoint:

```bash
echo 'DATABASE_URL=postgres://postgres:YOUR_PASSWORD@YOUR_ENDPOINT:5432/postgres' > .env
npm start
```

No rebuild needed. Reload `/admin`: the label now says **RDS PostgreSQL**, and the list is empty because this is a new database. Add a few sign-ups, then prove they live outside the instance:

```bash
rm signups.json
```

Restart the app. The sign-ups are still there, because they are in RDS.

What you did not have to do: open port 5432 by hand, pick subnets, install PostgreSQL, set up backups, or patch the database. RDS did all of it. The connection is encrypted and the app checks it is really talking to RDS, using Amazon's certificate bundle in `certs/`.

## If it does not work

The app writes errors to the terminal, and `/admin` shows a red banner.

| Terminal says | Fix |
|---|---|
| `timeout` or `Connection terminated` | The database was not created with **Connect to an EC2 compute resource** for this instance. In RDS, select the database, **Actions**, **Set up EC2 connection** |
| `password authentication failed` | Wrong password in `.env`. Check for typos; you can reset it with **Modify** on the database |
| `getaddrinfo ENOTFOUND` | The endpoint in `.env` has a typo |
| **Connect** fails to open the terminal | SSH (port 22) must allow **Anywhere**: EC2 Instance Connect connects from AWS's addresses, which **My IP** blocks |
| Label still says **Local JSON** | `.env` is not in the `aws-101-workshop` folder, or the app was not restarted |

## Optional: nginx on port 80 with Docker

See the README section "Run it behind nginx". Put the same `DATABASE_URL` line in `.env` next to `compose.yaml`.

## Tear it down

Everything costs money while it exists. Delete the RDS database (skip the final snapshot) and terminate the EC2 instance.
