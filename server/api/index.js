// This file acts as the entry point for Vercel Serverless Functions.
// It imports the Express app and exports it so Vercel can handle routing.

const app = require('../src/index');

module.exports = app;
