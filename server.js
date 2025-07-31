import express from 'express';
import fs from 'fs/promises';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

const PORT = process.env.PORT || 3000;
const DRIVE_FILE_ID = process.env.DRIVE_FILE_ID;
let useDrive = true;
if (!DRIVE_FILE_ID) {
  console.warn('DRIVE_FILE_ID not set, falling back to local data.json');
  useDrive = false;
}

const app = express();
app.use(express.json());

// Optional email transport for reminders
let mailTransport = null;
if (process.env.SMTP_HOST) {
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      : undefined
  });
}

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
  reminders: []
};

async function loadData() {
  try {
    if (useDrive) {
      const drive = await authorize();
      const res = await drive.files.get({ fileId: DRIVE_FILE_ID, alt: 'media' }, { responseType: 'json' });
      data = res.data;
    } else {
      const text = await fs.readFile('data.json', 'utf8');
      data = JSON.parse(text);
    }
  } catch (err) {
    console.error('Failed to load data, using defaults', err.message);
  }
}

async function saveData() {
  try {
    if (useDrive) {
      const drive = await authorize();
      await drive.files.update({
        fileId: DRIVE_FILE_ID,
        media: { mimeType: 'application/json', body: JSON.stringify(data) }
      });
    } else {
      await fs.writeFile('data.json', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Failed to save data', err.message);
  }
}

function sendReminderEmail(reminder) {
  if (!mailTransport || !reminder.email) return;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const mail = {
    from,
    to: reminder.email,
    subject: reminder.title || 'Reminder',
    text: `It's time for: ${reminder.title}`
  };
  mailTransport.sendMail(mail).catch(err => {
    console.error('Failed to send reminder email:', err.message);
  });
}

function checkReminders() {
  const now = Date.now();
  let changed = false;
  for (const rem of data.reminders) {
    if (!rem.sent && new Date(rem.time).getTime() <= now) {
      sendReminderEmail(rem);
      rem.sent = true;
      changed = true;
    }
  }
  if (changed) saveData();
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

app.get('/api/reminders', (_req, res) => {
  res.json(data.reminders);
});

app.post('/api/reminders', (req, res) => {
  const { time, title, email } = req.body;
  if (!time) {
    return res.status(400).json({ error: 'time required' });
  }
  const reminder = {
    id: Date.now().toString(),
    time,
    title: title || 'Reminder',
    email,
    sent: false
  };
  data.reminders.push(reminder);
  saveData();
  res.json(reminder);
});

loadData().then(() => {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  setInterval(checkReminders, 60 * 1000);
});