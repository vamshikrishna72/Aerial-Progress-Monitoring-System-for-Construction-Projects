// ─────────────────────────────────────────────────────────────
// components/PipelineExplainer.tsx
// Visual step-by-step breakdown of the CV pipeline
// ─────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import {
  UploadCloud, Crosshair, Sparkles, LayoutDashboard,
  ChevronRight,
} from 'lucide-react';

const STEPS = [
  {
    icon: UploadCloud,
    title: '1. Upload Photos',
    desc: 'Drag & drop drone photos of your site taken on different days.',
    color: 'from-blue-600 to-blue-500',
  },
  {
    icon: Crosshair,
    title: '2. Smart Alignment',
    desc: 'Our AI perfectly lines up the photos, even if the drone was at a slightly different angle.',
    color: 'from-purple-600 to-purple-500',
  },
  {
    icon: Sparkles,
    title: '3. Deep Analysis',
    desc: 'The system scans for structural changes, ignoring shadows and lighting differences.',
    color: 'from-amber-600 to-amber-500',
  },
  {
    icon: LayoutDashboard,
    title: '4. View Results',
    desc: 'See exact percentage of progress and view colorful heatmaps of what changed!',
    color: 'from-emerald-600 to-emerald-500',
  },
];

export default function PipelineExplainer() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass p-6 h-full flex flex-col"
    >
      <p className="section-label mb-1">How it Works</p>
      <h3 className="text-base font-semibold text-slate-200 mb-6">
        Your AI Construction Assistant
      </h3>

      <div className="space-y-4 flex-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex items-start gap-4 p-4 rounded-xl bg-surface-700/30 border border-white/[0.04] hover:border-white/10 transition-colors group overflow-hidden"
            >
              {/* Animated background sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              
              {/* Step icon */}
              <div className={`relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <div className="relative z-10 flex-1 min-w-0 pt-0.5">
                <span className="text-sm font-bold text-slate-200 block mb-1">{step.title}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
