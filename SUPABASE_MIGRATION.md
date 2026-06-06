# Supabase PostgreSQL Migration

This app now uses Prisma with PostgreSQL. Supabase should provide two connection strings:

- `DATABASE_URL`: pooled connection string for the running app.
- `DIRECT_URL`: direct connection string for Prisma migrations.

## 1. Create Supabase project

Create a Supabase project and open **Project Settings > Database > Connection string**.

Use the pooled connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL`.

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
GROQ_API_KEY=""
```

## 2. Generate Prisma client

```bash
npx prisma generate
```

## 3. Apply migrations

```bash
npm run prisma:migrate
```

This applies the PostgreSQL baseline migration in `prisma/migrations/0001_init`.

## 4. Seed demo data

```bash
npm run prisma:seed
```

This creates the demo businesses, FAQs, and owner users:

- `owner@powerfit.com / password123`
- `owner@glowstudio.com / password123`
- `owner@brightsmile.com / password123`

## 5. Verify health

Run:

```bash
npm run db:verify
npm run production:check
```

Start the app and open:

```text
/dashboard/health
```

The page should show database, Groq, auth, and core table counts.

The database-only page is also available at:

```text
/dashboard/database
```

## Notes

- The previous SQLite file `prisma/dev.db` is not used by PostgreSQL.
- The old SQLite helper `prisma/migrate-sqlite.ts` is no longer used by `npm run prisma:migrate`.
- Existing model names, fields, relations, and application logic are preserved.
