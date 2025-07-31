# FamilyNest Supabase Setup

FamilyNest now stores all data in [Supabase](https://supabase.com). The front end communicates directly with your Supabase project – no separate Node.js server is required.

## Configure Supabase

1. Create a project at [app.supabase.com](https://app.supabase.com/).
2. In **Project Settings → API** copy the **Project URL** and **anon public key**.
3. Copy `config.example.js` to `config.js` and fill in your project URL and anon key.

Once those values are set, the application will read and write wall posts, calendar events, chores and profile information directly from Supabase tables.

If the configured Supabase project is missing any of the expected tables, the application will now fall back to using browser `localStorage` so that it can still run without errors.

