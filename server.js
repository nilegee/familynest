import express from 'express';
import fs from 'fs/promises';
import { google } from 'googleapis';

const PORT = process.env.PORT || 3000;
const DRIVE_FILE_ID = process.env.DRIVE_FILE_ID;
if (!DRIVE_FILE_ID) {
  console.error('Missing DRIVE_FILE_ID environment variable');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Google OAuth2 setup
async function authorize() {
  const credentials = JSON.parse(await fs.readFile('credentials.json', 'utf8'));
  const token = JSON.parse(await fs.readFile('token.json', 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return google.drive({ version: 'v3', auth: oAuth2Client });
}

let data = {
  wallPosts: [],
  calendarEvents: [],
  chores: [],
  profiles: {},
  messages: []
};

async function loadData() {
  try {
    const drive = await authorize();
    const res = await drive.files.get({ fileId: DRIVE_FILE_ID, alt: 'media' }, { responseType: 'json' });
    data = res.data;
  } catch (err) {
    console.error('Failed to load from Drive, using defaults', err.message);
  }
}

async function saveData() {
  try {
    const drive = await authorize();
    await drive.files.update({
      fileId: DRIVE_FILE_ID,
      media: { mimeType: 'application/json', body: JSON.stringify(data) }
    });
  } catch (err) {
    console.error('Failed to save to Drive', err.message);
  }
}

// REST endpoints
app.get('/api/wallPosts', (_req, res) => {
  res.json(data.wallPosts);
});

app.post('/api/wallPosts', (req, res) => {
  data.wallPosts = req.body;
  saveData();
  res.json({ status: 'ok' });
});

app.get('/api/calendarEvents', (_req, res) => {
  res.json(data.calendarEvents);
});
app.post('/api/calendarEvents', (req, res) => {
  data.calendarEvents = req.body;
  saveData();
  res.json({ status: 'ok' });
});

app.get('/api/chores', (_req, res) => {
  res.json(data.chores);
});
app.post('/api/chores', (req, res) => {
  data.chores = req.body;
  saveData();
  res.json({ status: 'ok' });
});

app.get('/api/profiles', (_req, res) => {
  res.json(data.profiles);
});
app.post('/api/profiles', (req, res) => {
  data.profiles = req.body;
  saveData();
  res.json({ status: 'ok' });
});

app.get('/api/messages', (_req, res) => {
  res.json(data.messages);
});
app.post('/api/messages', (req, res) => {
  data.messages = req.body;
  saveData();
  res.json({ status: 'ok' });
});

loadData().then(() => {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
});
