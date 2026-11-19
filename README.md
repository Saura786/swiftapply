# InduVanta

InduVanta is a Next.js application for resume tailoring, ATS analysis, cover letters, interview preparation, and job application tracking.

## Requirements

- Node.js 20 or later
- A Supabase project
- An Anthropic API key

## Environment variables

Set these in your deployment provider and in `.env.local` for local development:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ANTHROPIC_API_KEY=...
```

The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported as a temporary fallback. Never put a Supabase secret/service-role key or Anthropic key in a `NEXT_PUBLIC_` variable.

## Database setup

Apply the migration in `supabase/migrations/` to the linked Supabase project before deploying. It creates a server-enforced, per-user UTC daily generation quota. The migration deliberately grants no direct table access; authenticated users can consume quota only through the narrowly scoped RPC.

## Authentication and API security

- Supabase Auth remains the identity provider.
- The browser obtains its current access token from the Supabase client and sends it as a Bearer token to protected Next.js route handlers.
- Each protected route validates the token against Supabase Auth using `auth.getUser(token)`; the server never trusts a browser-provided email or user ID.
- The AI generation route consumes the user's quota in Postgres before calling Anthropic. The database operation is atomic, so parallel requests cannot bypass the five-per-UTC-day limit.
- PDF extraction also requires a verified session.
- The Anthropic key is read only in the server route.
- The browser-side usage counter is only a convenience display; the database is authoritative.

## Run locally

```bash
npm ci
npm run dev
```

## Validate before deployment

```bash
npm run lint
npm run build
```

Verify the following in the Supabase dashboard:
1. The migration is applied successfully.
2. Email confirmation and password recovery redirect URLs include the deployed app origin.
3. The publishable key and project URL are configured in the hosting provider.
4. `ANTHROPIC_API_KEY` is configured as a server-only environment variable.

## Deployment

Connect the repository to the hosting provider (for example, Vercel), configure the environment variables above for the intended environments, and deploy the reviewed commit. Do not deploy until the database migration has been applied and the production Supabase project is active.
