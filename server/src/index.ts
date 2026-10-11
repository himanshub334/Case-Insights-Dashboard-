import 'dotenv/config';
import { app } from './app.js';
import { pool } from './db.js';
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`Case Insights API listening on http://localhost:${port}`));
async function shutdown() { server.close(); if (pool) await pool.end(); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
