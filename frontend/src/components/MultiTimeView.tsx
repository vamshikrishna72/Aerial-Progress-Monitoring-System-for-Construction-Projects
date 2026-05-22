// ─────────────────────────────────────────────────────────────
// components/MultiTimeView.tsx
// Timeline slider + step-by-step multi-time analysis viewer
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { TimeStep } from '../types';
import ImageViewer from './ImageViewer';
import MetricsCards from './MetricsCards';
import ProgressChart from './ProgressChart';

interface Props {
  steps: TimeStep[];
}

export default function MultiTimeView({ steps }: Props) {
  const [activeStep, setActiveStep] = useState(0);

  const chartData = steps.map((s, i) => ({
    step: s.time_step,
    change: s.metrics.change_percentage,
    regions: s.metrics.region_count,
    expected: s.metrics.deviation != null
      ? s.metrics.change_percentage - s.metrics.deviation
      : undefined,
  }));

  const current = steps[activeStep];

  return (
    <div className="space-y-6">
      {/* ── Timeline chart ── */}
      <ProgressChart data={chartData} title={`Multi-Time Analysis (${steps.length} transitions)`} />

      {/* ── Step navigator ── */}
      <div className="glass p-5">
        <p className="section-label mb-3">Timeline Navigator</p>

        {/* Step pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={clsx(
                'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                activeStep === i
                  ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                  : 'bg-surface-700 border-surface-500 text-slate-400 hover:border-surface-400',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {step.time_step}
              <span className={clsx(
                'badge text-[10px]',
                step.metrics.change_percentage > 25 ? 'badge-red' :
                step.metrics.change_percentage > 10 ? 'badge-amber' : 'badge-blue',
              )}>
                {step.metrics.change_percentage.toFixed(1)}%
              </span>
            </button>
          ))}
        </div>

        {/* Prev/Next */}
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={activeStep === 0}
            onClick={() => setActiveStep((s) => s - 1)}
            className="btn-secondary !px-3 !py-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-slate-500 font-mono">
            Step {activeStep + 1} / {steps.length}
          </span>
          <button
            disabled={activeStep === steps.length - 1}
            onClick={() => setActiveStep((s) => s + 1)}
            className="btn-secondary !px-3 !py-2 disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Current step detail ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 xl:grid-cols-5 gap-6"
        >
          <div className="xl:col-span-3">
            <ImageViewer images={current.images} timeLabel={current.time_step} />
          </div>
          <div className="xl:col-span-2">
            <MetricsCards metrics={current.metrics} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
