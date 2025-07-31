# FamilyNest Supabase Setup

FamilyNest now stores all data in [Supabase](https://supabase.com). The front end communicates directly with your Supabase project – no separate Node.js server is required.

## Configure Supabase

1. Create a project at [app.supabase.com](https://app.supabase.com/).
2. In **Project Settings → API** copy the **Project URL** and **anon public key**.
3. Open `script.js` and update the `supabaseUrl` and `supabaseKey` constants near the top of the file with your values.

Once those values are set, the application will read and write wall posts, calendar events, chores and profile information directly from Supabase tables.

## Optional Node.js server

The included `server.js` can sync the same data to Google Drive. To run it:

1. Install dependencies with `npm install`.
2. Create OAuth credentials (`credentials.json` and `token.json`) following the Google Drive API quickstart.
3. Set the `DRIVE_FILE_ID` environment variable to the ID of a JSON file in Drive. If this variable is omitted the server will read and write a local `data.json` file instead.
4. Start the server with `npm start`.

This step is optional; the front end works directly with Supabase without the Node server.
