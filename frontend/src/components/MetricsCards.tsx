// ─────────────────────────────────────────────────────────────
// components/MetricsCards.tsx
// ─────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import {
  TrendingUp, Target, Layers, CheckCircle2,
  AlertTriangle, XCircle, Cpu, ScanLine,
} from 'lucide-react';
import clsx from 'clsx';
import type { Metrics } from '../types';

interface Props { metrics: Metrics }

const statusConfig = {
  stable:   { label: 'Stable',   color: 'text-slate-400',   bg: 'bg-slate-500/20',   border: 'border-slate-500/30',   icon: CheckCircle2 },
  low:      { label: 'Low',      color: 'text-blue-400',    bg: 'bg-blue-500/20',    border: 'border-blue-500/30',    icon: TrendingUp },
  medium:   { label: 'Moderate', color: 'text-amber-400',   bg: 'bg-amber-500/20',   border: 'border-amber-500/30',   icon: TrendingUp },
  high:     { label: 'High',     color: 'text-orange-400',  bg: 'bg-orange-500/20',  border: 'border-orange-500/30',  icon: AlertTriangle },
  critical: { label: 'Critical', color: 'text-red-400',     bg: 'bg-red-500/20',     border: 'border-red-500/30',     icon: XCircle },
};

const progressColor = (pct: number) => {
  if (pct < 5)  return 'from-slate-500 to-slate-400';
  if (pct < 20) return 'from-blue-600 to-blue-400';
  if (pct < 40) return 'from-amber-600 to-amber-400';
  if (pct < 65) return 'from-orange-600 to-orange-400';
  return 'from-red-600 to-red-400';
};

export default function MetricsCards({ metrics }: Props) {
  const cfg = statusConfig[metrics.status] ?? statusConfig.stable;
  const StatusIcon = cfg.icon;

  const cards = [
    {
      label: 'Change Detected',
      value: `${metrics.change_percentage.toFixed(1)}%`,
      sub: metrics.progress_label,
      icon: TrendingUp,
      accent: 'brand',
    },
    {
      label: 'Areas of Change',
      value: String(metrics.region_count),
      sub: 'major construction spots',
      icon: Layers,
      accent: 'purple',
    },
    {
      label: 'Image Alignment',
      value: metrics.aligned ? 'Perfect ✓' : 'Failed ✕',
      sub: `${metrics.match_count} matching points found`,
      icon: Target,
      accent: metrics.aligned ? 'green' : 'amber',
    },
    ...(metrics.ssim_score != null
      ? [{
          label: 'Structural Match',
          value: metrics.ssim_score.toFixed(3),
          sub: '1.0 is identical',
          icon: ScanLine,
          accent: 'cyan',
        }]
      : []),
    {
      label: 'Analysis Type',
      value: metrics.mode === 'ssim' ? 'Deep Analysis' : 'Quick Compare',
      sub: metrics.mode === 'ssim' ? 'AI structural check' : 'Fast visual scan',
      icon: Cpu,
      accent: 'indigo',
    },
  ];

  const accentMap: Record<string, string> = {
    brand:  'from-brand-600/30 to-brand-500/10 border-brand-500/30 text-brand-300',
    purple: 'from-purple-600/30 to-purple-500/10 border-purple-500/30 text-purple-300',
    green:  'from-emerald-600/30 to-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber:  'from-amber-600/30 to-amber-500/10 border-amber-500/30 text-amber-300',
    cyan:   'from-cyan-600/30 to-cyan-500/10 border-cyan-500/30 text-cyan-300',
    indigo: 'from-indigo-600/30 to-indigo-500/10 border-indigo-500/30 text-indigo-300',
  };

  return (
    <div className="space-y-5">
      {/* ── Status banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          'flex items-center gap-4 p-5 rounded-2xl border',
          cfg.bg, cfg.border,
        )}
      >
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', cfg.bg)}>
          <StatusIcon className={clsx('w-6 h-6', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Construction Status
          </p>
          <p className={clsx('text-xl font-bold mt-0.5', cfg.color)}>
            {metrics.progress_label}
          </p>
        </div>
        {metrics.timeline_status && (
          <div className={clsx(
            'badge text-xs',
            metrics.timeline_status.includes('Ahead') || metrics.timeline_status.includes('Track')
              ? 'badge-green'
              : 'badge-red',
          )}>
            {metrics.timeline_status}
          </div>
        )}
      </motion.div>

      {/* ── Change progress bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass p-5"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="section-label">Change Intensity</span>
          <span className="text-2xl font-bold gradient-text count-up">
            {metrics.change_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <motion.div
            className={clsx('progress-fill bg-gradient-to-r', progressColor(metrics.change_percentage))}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(metrics.change_percentage, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
        {metrics.deviation != null && (
          <p className="text-xs text-slate-500 mt-2">
            Deviation from expected:{' '}
            <span className={clsx(
              'font-semibold',
              metrics.deviation >= 0 ? 'text-emerald-400' : 'text-red-400',
            )}>
              {metrics.deviation >= 0 ? '+' : ''}{metrics.deviation.toFixed(1)}%
            </span>
          </p>
        )}
      </motion.div>

      {/* ── Stat cards grid ── */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, sub, icon: Icon, accent }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className={clsx(
              'p-4 rounded-xl border bg-gradient-to-br',
              accentMap[accent] ?? accentMap.brand,
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">
                {label}
              </span>
              <Icon className="w-3.5 h-3.5 opacity-60" />
            </div>
            <p className="text-xl font-bold text-white count-up">{value}</p>
            <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
