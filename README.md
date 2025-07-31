# FamilyNest Supabase Setup

FamilyNest now stores all data in [Supabase](https://supabase.com). The front end communicates directly with your Supabase project – no separate Node.js server is required.

## Configure Supabase

1. Create a project at [app.supabase.com](https://app.supabase.com/).
2. In **Project Settings → API** copy the **Project URL** and **anon public key**.
3. Copy `config.example.js` to `config.js` and fill in your project URL and anon key.
4. Ensure `index.html` includes `<script src="config.js"></script>` before `script.js` so your credentials are loaded.

Once those values are set, the application will read and write wall posts, calendar events, chores and profile information directly from Supabase tables.

If the configured Supabase project is missing any of the expected tables, the application will now fall back to using browser `localStorage` so that it can still run without errors.

## Required Tables

FamilyNest expects the following tables to exist in your Supabase project:

| Table            | Description                        | Example Columns                       |
|------------------|------------------------------------|---------------------------------------|
| `wall_posts`     | Posts on the family wall           | `id` (text), `member` (text), `text` (text), `date` (timestamp), `reactions` (json) |
| `Q&A Table`      | Questions and answers              | `id` (text), `q` (text), `a` (text)   |
| `calendar_events`| Events for the family calendar     | `id` (text), `start` (date), `end` (date), `desc` (text) |
| `profiles`       | Profile information for each user  | `name` (text), `value` (json)         |
| `chores`         | Chores assigned to family members  | `id` (text), `desc` (text), `assignedTo` (text), `due` (date), `daily` (boolean), `completed` (boolean) |
| `user_points`    | Points for each family member       | `name` (text), `value` (integer)      |
| `badges`         | Earned badges for members           | `name` (text), `value` (json)         |
| `completed_chores`| Total chores completed            | `name` (text), `value` (integer)      |

If you see `PGRST205` errors in the browser console, it usually means one of these tables is missing. Create the table with the example columns above, then reload the app.

