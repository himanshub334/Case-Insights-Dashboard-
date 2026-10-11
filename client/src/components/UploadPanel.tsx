import { useRef, useState } from 'react';
import { FileUp, FileCheck2, LoaderCircle, X } from 'lucide-react';
import { api } from '../lib/api';

type Result = { imported: number; rejected: number; errors: string[] };
export default function UploadPanel({ onComplete, onClose }: { onComplete: () => void; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<Result | null>(null);
  async function submit() { if (!file) return; setBusy(true); setError(''); try { const r = await api.upload(file); setResult(r); onComplete(); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); } }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
    <div className="modal-heading"><div><p className="eyebrow">DATA MANAGEMENT</p><h2 id="upload-title">Import a case dataset</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
    {!result ? <><button className="dropzone" onClick={() => input.current?.click()}><FileUp size={28}/><strong>{file ? file.name : 'Choose a CSV file'}</strong><span>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'CSV format · up to 10 MB'}</span><small>Required: case_type, status, priority, owner, created_at</small></button><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }}/>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!file || busy} onClick={submit}>{busy && <LoaderCircle className="spin" size={16}/>} Validate & import</button></div></> : <div className="upload-result"><FileCheck2 size={34}/><h3>Import finished</h3><p><b>{result.imported}</b> records imported · <b>{result.rejected}</b> rejected</p>{result.errors.length > 0 && <div className="error-list">{result.errors.slice(0, 5).map((x, i) => <p key={i}>{x}</p>)}</div>}<button className="btn-primary" onClick={onClose}>Done</button></div>}
  </section></div>;
}
