# FoodTracker

## Clone MySQL Database To Another Computer

Use this process to set up the same MySQL database used by this repo on a different machine.

### 1. Confirm backend DB config

The backend uses these environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

The expected database name is `foodtracker`.

### 2. Install MySQL on the new computer

Install both MySQL server and client tools so you can run `mysql` and `mysqldump`.

### 3. Create the database and user on the new computer

Log into MySQL as an admin user and run:

```sql
CREATE DATABASE foodtracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'foodtracker_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON foodtracker.* TO 'foodtracker_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure backend environment

Create or update `foodtracker-backend/.env` on the new computer:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=foodtracker_user
DB_PASSWORD=strong_password_here
DB_NAME=foodtracker
```

### 5. Export the current database from the source computer

Run this on the current computer:

```bash
mysqldump -u <current_user> -p --single-transaction --routines --triggers foodtracker > foodtracker.sql
```

### 6. Transfer and import on the new computer

Copy `foodtracker.sql` to the new computer, then run:

```bash
mysql -u foodtracker_user -p foodtracker < foodtracker.sql
```

### 7. Start backend and verify

```bash
cd foodtracker-backend
yarn install
yarn start:dev
```

Check that tables exist:

```bash
mysql -u foodtracker_user -p -e "USE foodtracker; SHOW TABLES;"
```

### Production note

In development, TypeORM can auto-sync schema.
In production (`NODE_ENV=production`), auto-sync is disabled, so importing a dump (or running migrations if added later) is required.
