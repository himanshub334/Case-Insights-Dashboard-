import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { randomUUID } from 'node:crypto';
import { pool, query } from './db.js';
import { validateCsvRows } from './validation.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024, files: 1 } });
export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
const asyncRoute = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
function periodClause(period: unknown, startIndex: number) { const p = String(period || '30d'); if (p === '7d') return { sql: `created_at >= NOW() - INTERVAL '7 days'`, values: [] as unknown[] }; if (p === '90d') return { sql: `created_at >= NOW() - INTERVAL '90 days'`, values: [] as unknown[] }; if (p === 'all') return { sql: 'TRUE', values: [] as unknown[] }; return { sql: `created_at >= NOW() - INTERVAL '30 days'`, values: [] as unknown[] }; }
function filters(queryParams: URLSearchParams | Record<string, unknown>, startIndex = 1) { const conditions: string[] = []; const values: unknown[] = []; const status = queryParams instanceof URLSearchParams ? queryParams.get('status') : queryParams.status; const q = queryParams instanceof URLSearchParams ? queryParams.get('q') : queryParams.q; const period = queryParams instanceof URLSearchParams ? queryParams.get('period') : queryParams.period; const time = periodClause(period, startIndex); conditions.push(time.sql); if (status && status !== 'All statuses') { values.push(status); conditions.push(`status = $${startIndex + values.length - 1}`); } if (q) { values.push(`%${String(q).slice(0, 120)}%`); conditions.push(`(id ILIKE $${startIndex + values.length - 1} OR case_type ILIKE $${startIndex + values.length - 1} OR owner ILIKE $${startIndex + values.length - 1})`); } return { where: conditions.join(' AND '), values }; }
app.get('/api/health', asyncRoute(async (_req, res) => { let database = 'not configured'; if (pool) { await query('SELECT 1'); database = 'connected'; } res.json({ status: 'ok', database }); }));
app.get('/api/cases', asyncRoute(async (req, res) => { const f = filters(req.query as Record<string, unknown>); const count = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM cases WHERE ${f.where}`, f.values); const rows = await query(`SELECT id, case_type, status, priority, owner, created_at, resolution_hours, satisfaction, amount FROM cases WHERE ${f.where} ORDER BY created_at DESC LIMIT 200`, f.values); res.json({ rows: rows.rows, total: Number(count.rows[0]?.count ?? 0) }); }));
app.get('/api/summary', asyncRoute(async (req, res) => {
  const f = filters({ period: req.query.period }); const where = f.where;
  const [totals, byMonth, byType, byStatus, byPriority] = await Promise.all([
    query<{total:string;open:string;resolved:string;avg_resolution:string|null;avg_satisfaction:string|null}>(`SELECT COUNT(*)::text total, COUNT(*) FILTER (WHERE LOWER(status) NOT IN ('resolved','closed','complete','completed'))::text open, COUNT(*) FILTER (WHERE LOWER(status) IN ('resolved','closed','complete','completed'))::text resolved, AVG(resolution_hours)::text avg_resolution, AVG(satisfaction)::text avg_satisfaction FROM cases WHERE ${where}`),
    query(`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') month, COUNT(*)::int opened, COUNT(*) FILTER (WHERE LOWER(status) IN ('resolved','closed','complete','completed'))::int resolved FROM cases WHERE ${where} GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`),
    query(`SELECT case_type AS name, COUNT(*)::int value FROM cases WHERE ${where} GROUP BY case_type ORDER BY value DESC LIMIT 8`),
    query(`SELECT status AS name, COUNT(*)::int value FROM cases WHERE ${where} GROUP BY status ORDER BY value DESC`),
    query(`SELECT priority AS name, COUNT(*)::int value FROM cases WHERE ${where} GROUP BY priority ORDER BY CASE LOWER(priority) WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`)
  ]);
  const t = totals.rows[0]; res.json({ total: Number(t?.total ?? 0), open: Number(t?.open ?? 0), resolved: Number(t?.resolved ?? 0), avgResolutionHours: Number(t?.avg_resolution ?? 0), avgSatisfaction: Number(t?.avg_satisfaction ?? 0), byMonth: byMonth.rows, byType: byType.rows, byStatus: byStatus.rows, byPriority: byPriority.rows });
}));
app.post('/api/upload', upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Choose a CSV file to upload.' });
  if (!req.file.originalname.toLowerCase().endsWith('.csv')) return res.status(415).json({ error: 'Only .csv files are supported.' });
  let parsedRows: Record<string, unknown>[];
  try { parsedRows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true, relax_column_count: false, max_record_size: 100_000 }) as Record<string, unknown>[]; } catch (e) { return res.status(400).json({ error: `Could not parse CSV: ${e instanceof Error ? e.message : 'invalid format'}` }); }
  const validation = validateCsvRows(parsedRows); if (!validation.imported.length) return res.status(422).json({ error: 'No valid rows to import.', datasetId: null, imported: 0, rejected: parsedRows.length, errors: validation.errors.slice(0, 20) });
  if (!pool) return res.status(503).json({ error: 'Database is not configured. Set DATABASE_URL and start PostgreSQL.' });
  const client = await pool.connect(); const datasetId = randomUUID(); let imported = 0;
  try {
    await client.query('BEGIN'); await client.query('INSERT INTO datasets(id, filename, imported_count, rejected_count) VALUES($1,$2,$3,$4)', [datasetId, req.file.originalname, validation.imported.length, validation.errors.length]);
    for (const r of validation.imported) {
      await client.query(`INSERT INTO cases(id,dataset_id,case_type,status,priority,owner,created_at,resolution_hours,satisfaction,amount) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET dataset_id=EXCLUDED.dataset_id,case_type=EXCLUDED.case_type,status=EXCLUDED.status,priority=EXCLUDED.priority,owner=EXCLUDED.owner,created_at=EXCLUDED.created_at,resolution_hours=EXCLUDED.resolution_hours,satisfaction=EXCLUDED.satisfaction,amount=EXCLUDED.amount`, [r.id, datasetId, r.case_type, r.status, r.priority, r.owner, r.created_at, r.resolution_hours, r.satisfaction, r.amount]); imported++;
    }
    await client.query('COMMIT'); res.status(201).json({ datasetId, imported, rejected: validation.errors.length, errors: validation.errors.slice(0, 20) });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}));
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => { if (err instanceof multer.MulterError) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the upload size limit.' : 'Upload could not be processed.' }); console.error(err); return res.status(500).json({ error: 'Unexpected server error. Check the API logs.' }); });
