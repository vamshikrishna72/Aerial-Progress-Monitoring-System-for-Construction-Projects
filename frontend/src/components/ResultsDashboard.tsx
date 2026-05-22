// ─────────────────────────────────────────────────────────────
// components/ResultsDashboard.tsx
// Top-level results container — pairwise OR multi-time
// ─────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import { RefreshCw, Download, CheckCircle2 } from 'lucide-react';
import type { ProcessResult } from '../types';
import ImageViewer from './ImageViewer';
import MetricsCards from './MetricsCards';
import ProgressChart from './ProgressChart';
import MultiTimeView from './MultiTimeView';

interface Props {
  result: ProcessResult;
  onReset: () => void;
}

export default function ResultsDashboard({ result, onReset }: Props) {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv_results_${result.task_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── Results header banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Analysis Complete</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Task ID: {result.task_id}
            </p>
          </div>
        </div>
        <div className="sm:ml-auto flex gap-2">
          <button onClick={downloadJSON} className="btn-secondary !py-2">
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button onClick={onReset} className="btn-secondary !py-2">
            <RefreshCw className="w-4 h-4" />
            New Analysis
          </button>
        </div>
      </div>

      {/* ── Pairwise result ── */}
      {result.type === 'pairwise' && (
        <div className="space-y-6">
          {/* Progress chart (single point) */}
          <ProgressChart
            data={[{
              step: 't1 → t2',
              change: result.metrics.change_percentage,
              regions: result.metrics.region_count,
              expected: result.metrics.deviation != null
                ? result.metrics.change_percentage - result.metrics.deviation
                : undefined,
            }]}
            title="Pairwise Change Analysis"
          />

          {/* Main panel */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <div className="xl:col-span-3">
              <ImageViewer images={result.images} />
            </div>
            <div className="xl:col-span-2">
              <MetricsCards metrics={result.metrics} />
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-time result ── */}
      {result.type === 'multi_time' && (
        <MultiTimeView steps={result.steps} />
      )}
    </motion.div>
  );
}
