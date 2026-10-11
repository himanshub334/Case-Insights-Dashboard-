import { z } from 'zod';
export const requiredColumns = ['case_type', 'status', 'priority', 'owner', 'created_at'] as const;
const optionalNumber = (min: number, max: number) => z.preprocess(v => v === '' || v === null || v === undefined ? null : Number(v), z.number().finite().min(min).max(max).nullable());
export const caseRowSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  case_type: z.string().trim().min(1).max(100),
  status: z.string().trim().min(1).max(40),
  priority: z.string().trim().min(1).max(20),
  owner: z.string().trim().min(1).max(120),
  created_at: z.string().trim().min(1).refine(v => !Number.isNaN(Date.parse(v)), 'created_at must be a valid date'),
  resolution_hours: optionalNumber(0, 1_000_000).optional(),
  satisfaction: optionalNumber(1, 5).optional(),
  amount: optionalNumber(-1_000_000_000, 1_000_000_000).optional()
}).transform((r, index) => ({ ...r, id: r.id || `CASE-${Date.now()}-${index}`, created_at: new Date(r.created_at).toISOString(), resolution_hours: r.resolution_hours ?? null, satisfaction: r.satisfaction ?? null, amount: r.amount ?? null }));
export function validateCsvRows(rows: Record<string, unknown>[]) {
  const imported: z.infer<typeof caseRowSchema>[] = []; const errors: string[] = [];
  if (!rows.length) return { imported, errors: ['The CSV contains no data rows.'] };
  const columns = Object.keys(rows[0]); const missing = requiredColumns.filter(c => !columns.includes(c));
  if (missing.length) return { imported, errors: [`Missing required columns: ${missing.join(', ')}`] };
  rows.forEach((row, index) => { const parsed = caseRowSchema.safeParse(row); if (parsed.success) imported.push(parsed.data); else errors.push(`Row ${index + 2}: ${parsed.error.issues.map(i => `${i.path.join('.') || 'row'} ${i.message}`).join('; ')}`); });
  return { imported, errors };
}
