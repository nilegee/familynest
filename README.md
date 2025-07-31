# FamilyNest Backend Setup

This repository now includes a minimal Node.js backend that stores app data in a Google Drive file. The server exposes REST endpoints that the front‑end uses to load and save wall posts, calendar events, chores and profile information.

## Enable Google Drive API
1. Visit <https://console.cloud.google.com/apis/dashboard> and create a new project.
2. Enable **Google Drive API** for the project.
3. In **APIs & Services → Credentials** create an OAuth **Desktop** application and download the `credentials.json` file.
4. Run `node server.js` once to generate the OAuth consent URL. Open the link, grant access and place the returned code into the console. The resulting `token.json` stores the access token.

## Configure and Run the Server
1. Place `credentials.json` and the generated `token.json` in the project root.
2. Create an empty file in your Google Drive and copy its ID. Set it as the environment variable `DRIVE_FILE_ID`.
3. Install dependencies and start the server:
   ```bash
   npm install
   DRIVE_FILE_ID=your_drive_file_id npm start
   ```
   The server listens on port `3000` by default.

   To enable email reminders, set the following optional variables:
   - `SMTP_HOST` and `SMTP_PORT`
   - `SMTP_USER` and `SMTP_PASS` for authentication
   - `SMTP_FROM` (defaults to `SMTP_USER`)

## Update `script.js`
Edit `script.js` if the server URL differs. Change the `API_BASE` constant near the top of the file to point to your backend (e.g. `http://localhost:3000/api`).

## Endpoints
The backend exposes the following routes:
- `GET/POST /api/wallPosts`
- `GET/POST /api/calendarEvents`
- `GET/POST /api/chores`
- `GET/POST /api/profiles`
- `GET /api/reminders` to list scheduled reminders
- `POST /api/reminders` to schedule a new reminder

The client performs `POST` calls with the entire dataset and expects `JSON` responses.
