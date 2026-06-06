# Production Deployment

This guide deploys InstaReply AI with Supabase PostgreSQL, Groq AI fallback, and Vercel.

## 1. Supabase setup

1. Create a Supabase project.
2. Open **Project Settings > Database > Connection string**.
3. Copy both connection strings:
   - Pooled connection string for the app runtime.
   - Direct connection string for Prisma migrations.
4. Keep SSL enabled. Supabase connection strings usually include the correct SSL settings.

Use:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

## 2. Environment variables

Required production variables:

```env
DATABASE_URL=""
DIRECT_URL=""
GROQ_API_KEY=""
AUTH_SECRET=""
```

Notes:

- `DATABASE_URL` should be the pooled Supabase URL.
- `DIRECT_URL` should be the direct Supabase URL.
- `GROQ_API_KEY` enables Groq AI fallback.
- `AUTH_SECRET` must be a long random string in production.

Generate an auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Local verification

After filling `.env`, run:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run db:verify
npm run production:check
npm run lint
npm run build
```

If Prisma reports authentication failures:

- Reset the database password in Supabase.
- Update both `DATABASE_URL` and `DIRECT_URL`.
- URL-encode special password characters such as `@`, `#`, `%`, `/`, `?`, `:` and spaces.
- Confirm the username matches the connection string Supabase gives you. Pooled URLs often use `postgres.<project-ref>`, while direct URLs often use `postgres`.

Expected seeded owner users:

- `owner@powerfit.com`
- `owner@glowstudio.com`
- `owner@brightsmile.com`

## 4. Vercel deployment

1. Import the repository into Vercel.
2. Add the production environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `GROQ_API_KEY`
   - `AUTH_SECRET`
3. Set the build command:

```bash
npm run prisma:generate && npm run build
```

4. Deploy.

Run migrations from your local machine or CI before/after deployment:

```bash
npm run prisma:migrate
npm run prisma:seed
```

## 5. Production commands

Generate Prisma client:

```bash
npm run prisma:generate
```

Apply migrations:

```bash
npm run prisma:migrate
```

Seed demo businesses and owners:

```bash
npm run prisma:seed
```

Verify migration and seed data:

```bash
npm run db:verify
```

Run production readiness checks:

```bash
npm run production:check
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

## 6. Runtime verification

After login, open:

```text
/dashboard/health
```

The page shows:

- Database Connected
- Groq Connected
- Auth Working
- Total Businesses
- Total Users
- Total Leads
- Total Conversations

The older database-only page remains available at:

```text
/dashboard/database
```
