// =============================================================================
// Calendar Routes — /api/calendar
// =============================================================================
// Integrates with Google Calendar for smart expense suggestions.

const express = require('express');
const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback'
);

// ---------------------------------------------------------------------------
// GET /api/calendar/auth-url
// Returns the Google OAuth consent URL.
// ---------------------------------------------------------------------------
router.get('/auth-url', auth, (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google Calendar integration is not configured on the server.' });
  }

  // We pass the userId in the state parameter to know who is connecting when they return
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request a refresh token
    prompt: 'consent', // Force consent prompt to guarantee refresh token on reconnect
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: req.user.id
  });

  res.json({ url });
});

// ---------------------------------------------------------------------------
// GET /api/calendar/callback
// Handles the OAuth redirect from Google, exchanges code for tokens.
// ---------------------------------------------------------------------------
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect(`http://localhost:5173/integrations?error=${error}`);
  }

  if (!code || !userId) {
    return res.status(400).send('Missing code or state parameter.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    // Save or update the tokens in the database
    await prisma.calendarConnection.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        // Keep existing refresh token if Google didn't send a new one
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '', // Should always be present on first auth due to prompt: 'consent'
      },
    });

    // Redirect back to the frontend
    res.redirect('http://localhost:5173/integrations?success=true');
  } catch (err) {
    console.error('Calendar callback error:', err);
    res.redirect('http://localhost:5173/integrations?error=auth_failed');
  }
});

// ---------------------------------------------------------------------------
// GET /api/calendar/status
// Returns whether the user has a connected calendar.
// ---------------------------------------------------------------------------
router.get('/status', auth, async (req, res) => {
  try {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId: req.user.id }
    });
    res.json({ connected: !!conn });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/calendar/disconnect
// Removes the calendar connection.
// ---------------------------------------------------------------------------
router.delete('/disconnect', auth, async (req, res) => {
  try {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId: req.user.id }
    });
    
    if (conn) {
      // Optional: revoke the token with Google
      try {
        await oauth2Client.revokeToken(conn.refreshToken || conn.accessToken);
      } catch (e) {
        console.warn('Failed to revoke token with Google, but proceeding to delete locally.');
      }
      
      await prisma.calendarConnection.delete({
        where: { userId: req.user.id }
      });
    }

    res.json({ message: 'Calendar disconnected' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/calendar/suggestions
// Fetches recent events and suggests possible expenses.
// ---------------------------------------------------------------------------
router.get('/suggestions', auth, async (req, res) => {
  try {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId: req.user.id }
    });

    if (!conn) {
      return res.status(403).json({ error: 'Calendar not connected' });
    }

    // Set credentials for this user
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    client.setCredentials({
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: client });

    // Look back 7 days for events that might have generated an expense
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    const timeMax = new Date();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Financial keywords to filter by
    const keywords = ['lunch', 'dinner', 'breakfast', 'drinks', 'coffee', 'flight', 'train', 'hotel', 'uber', 'cab', 'concert', 'movie', 'ticket', 'grocery', 'shopping'];
    
    // Filter events based on keywords in summary (title)
    const possibleExpenses = events.filter(event => {
      if (!event.summary) return false;
      const title = event.summary.toLowerCase();
      return keywords.some(kw => title.includes(kw));
    });

    // Check existing expenses in DB to avoid double-suggesting
    const userExpenses = await prisma.expense.findMany({
      where: {
        userId: req.user.id,
        date: { gte: timeMin }
      }
    });

    const suggestions = [];

    for (const event of possibleExpenses) {
      // Use start date of the event
      const eventDate = new Date(event.start.dateTime || event.start.date);
      const title = event.summary;

      // Check if the user already logged this. 
      const alreadyLogged = userExpenses.some(ex => {
        const exDate = new Date(ex.date);
        const isSameDay = exDate.toISOString().split('T')[0] === eventDate.toISOString().split('T')[0];
        const hasSimilarNote = ex.note && (ex.note.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(ex.note.toLowerCase()));
        return isSameDay && hasSimilarNote;
      });

      if (!alreadyLogged) {
        suggestions.push({
          eventId: event.id,
          title: title,
          date: eventDate.toISOString(),
          link: event.htmlLink
        });
      }
    }

    res.json({ suggestions });
  } catch (err) {
    console.error('Fetch calendar events error:', err);
    if (err.message && (err.message.includes('invalid_grant') || err.message.includes('credentials'))) {
       return res.status(401).json({ error: 'Calendar connection expired. Please reconnect.' });
    }
    res.status(500).json({ error: 'Server error while fetching calendar events.' });
  }
});

module.exports = router;
