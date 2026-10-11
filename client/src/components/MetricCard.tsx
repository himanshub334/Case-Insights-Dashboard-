import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
export default function MetricCard({ label, value, note, icon: Icon, delay = 0 }: { label: string; value: string; note: string; icon: LucideIcon; delay?: number }) {
  return <motion.article className="metric-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35, delay }} whileHover={{ y: -3 }}>
    <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-note">{note}</div>
  </motion.article>;
}
