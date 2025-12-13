# Neon Database Setup Guide

## Steps to Deploy with Neon Database

### 1. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy the application

### 2. Set Up Environment Variables

Based on the Neon tutorial you followed, you should have:

1. A `DATABASE_URL` environment variable from Neon
2. Run this command to pull the variables locally:
   ```bash
   vercel env pull .env.development.local
   ```

### 3. Run Database Migrations

After you have the environment variables set up:

#### For Local Development:

```bash
# Generate migrations (if not done already)
pnpm db:generate

# Run migrations
pnpm db:migrate
```

#### For Production:

The migrations will run automatically during the Vercel build process.

### 4. Seed the Database (Optional)

Once migrations are run, you can seed the database with initial questions:

```bash
pnpm db:seed
```

## Important Notes

- **Neon Database**: You're using Neon, which is a PostgreSQL-compatible serverless database
- **Connection**: Uses HTTP-based connection via @neondatabase/serverless
- **Environment Variable**: Uses `DATABASE_URL` (not `POSTGRES_URL`)
- **Serverless**: Perfect for Vercel deployments with automatic scaling

## Files Updated for Neon PostgreSQL

- ✅ `db/index.ts` - Updated to use Neon serverless driver
- ✅ `db/schema.ts` - Converted to PostgreSQL schema (compatible with Neon)
- ✅ `drizzle.config.ts` - Updated for PostgreSQL dialect with DATABASE_URL
- ✅ `package.json` - Added @neondatabase/serverless dependency
- ✅ Generated PostgreSQL migrations

## What's Ready

Your application is now ready for Vercel deployment with Neon database! 🎉

The database connection will work automatically once you have the `DATABASE_URL` environment variable set up in Vercel.

## Next Steps

1. Make sure your Neon database `DATABASE_URL` is set in your Vercel project environment variables
2. Push your code to trigger a deployment
3. The migrations will run automatically during build
4. Optionally run the seed script to add initial questions

## Steps to Deploy with Vercel Postgres

### 1. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy the application

### 2. Add Vercel Postgres Database

1. Go to your project dashboard on Vercel
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose "Hobby" (Free tier - 0.5GB storage, 1 billion queries/month)
6. Click "Create & Continue"

### 3. Connect Database to Your Project

1. Vercel will automatically add the following environment variables:

   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NO_SSL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

2. Your app will automatically use `POSTGRES_URL` (already configured in `drizzle.config.ts`)

### 4. Run Database Migrations

After deployment, you have two options:

#### Option A: Use Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run migrations in production
vercel env pull .env.local
pnpm db:migrate
```

#### Option B: Add Migration to Build Process

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "build": "pnpm db:migrate && next build"
  }
}
```

### 5. Seed the Database (Optional)

Once migrations are run, you can seed the database:

```bash
pnpm db:seed
```

## Important Notes

- **Free Tier Limits**: Hobby plan includes 0.5GB storage and 1 billion read/write operations per month
- **Connection Pooling**: Vercel Postgres includes connection pooling automatically
- **SSL**: Connections are SSL-encrypted by default
- **Backups**: Automatic daily backups included

## Files Updated for PostgreSQL

- ✅ `db/index.ts` - Updated to use Vercel Postgres
- ✅ `db/schema.ts` - Converted from SQLite to PostgreSQL schema
- ✅ `drizzle.config.ts` - Updated for PostgreSQL dialect
- ✅ `package.json` - Added necessary dependencies
- ✅ Generated fresh PostgreSQL migrations

## What's Ready

Your application is now ready for Vercel deployment with PostgreSQL! 🎉

The database will be created automatically when you add Vercel Postgres storage to your project.
