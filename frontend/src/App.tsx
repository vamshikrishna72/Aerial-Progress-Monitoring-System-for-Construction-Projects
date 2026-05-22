// ─────────────────────────────────────────────────────────────
// App.tsx — Root application component
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Satellite, ChevronDown, Info,
  FlaskConical, BookOpen,
} from 'lucide-react';

import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ResultsDashboard from './components/ResultsDashboard';
import PipelineExplainer from './components/PipelineExplainer';

import { uploadImages, processImages } from './api/client';
import type { AppState, DetectionMode, ProcessResult } from './types';

// ─────────────────────────────────────────────────────────────
// Processing stage indicator
// ─────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'upload',    label: 'Uploading images',        pct: 20 },
  { id: 'preproc',  label: 'Preprocessing & aligning', pct: 45 },
  { id: 'detect',   label: 'Detecting changes',        pct: 70 },
  { id: 'estimate', label: 'Estimating progress',      pct: 90 },
  { id: 'done',     label: 'Finalizing results',       pct: 100 },
];

function ProcessingOverlay({ stage }: { stage: number }) {
  const current = STAGES[Math.min(stage, STAGES.length - 1)];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="glass p-8 text-center space-y-6"
    >
      {/* Spinning satellite icon */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 animate-pulse" />
        <div className="absolute inset-2 rounded-full border-2 border-dashed border-brand-500/40"
          style={{ animation: 'spin 4s linear infinite' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Satellite className="w-8 h-8 text-brand-400" />
        </div>
      </div>

      <div>
        <p className="text-lg font-semibold text-slate-200">{current.label}</p>
        <p className="text-sm text-slate-500 mt-1">Running CV pipeline on server…</p>
      </div>

      {/* Progress bar */}
      <div className="max-w-xs mx-auto space-y-2">
        <div className="progress-bar h-1.5">
          <motion.div
            className="progress-fill bg-gradient-to-r from-brand-600 to-brand-400"
            initial={{ width: '5%' }}
            animate={{ width: `${current.pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-right text-xs text-brand-400 font-mono">{current.pct}%</p>
      </div>

      {/* Stage pills */}
      <div className="flex justify-center gap-2 flex-wrap">
        {STAGES.map((s, i) => (
          <span
            key={s.id}
            className={`badge text-[10px] ${
              i < stage ? 'badge-green' :
              i === stage ? 'badge-blue' :
              'bg-surface-600 text-slate-600 border border-surface-500'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero section (shown before any uploads)
// ─────────────────────────────────────────────────────────────
function HeroBanner() {
  return (
    <div className="relative text-center py-10 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 glow-orb-blue opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 glow-orb-purple opacity-30 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 badge-blue mb-6 text-xs px-3 py-1.5">
          <FlaskConical className="w-3.5 h-3.5" />
          Smart AI Construction Analysis
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
          Track Your <span className="gradient-text">Construction Progress</span>
          <br />
          Effortlessly
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Upload drone photos taken over time and let our smart AI highlight exactly what changed. See the progress visually and instantly. No technical skills required.
        </p>

        {/* Generated Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/20 border border-white/10 mb-8"
        >
          <img src="/hero_drone.png" alt="Drone Scanning Construction Site" className="w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent opacity-90" />
        </motion.div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {[
            '🛰 Smart Image Alignment',
            '🔥 Visual Change Heatmaps',
            '📊 Simple Progress Metrics',
            '🕒 Easy Timeline Tracking',
            '🤖 Powerful AI Analysis',
          ].map((f) => (
            <span key={f} className="px-3 py-1.5 rounded-full bg-surface-700/60 border border-white/[0.06] text-slate-400">
              {f}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="mt-8 flex justify-center"
      >
        <ChevronDown className="w-5 h-5 text-slate-600" />
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [showExplainer, setShowExplainer] = useState(false);

  const handleSubmit = useCallback(async (
    files: File[],
    mode: DetectionMode,
    expectedPct?: number,
  ) => {
    try {
      setAppState('uploading');
      setProcessingStage(0);

      // ── Step 1: Upload ──
      const uploadResp = await uploadImages(files);
      setProcessingStage(1);

      // ── Step 2-4: Process ──
      toast.promise(
        (async () => {
          setAppState('processing');
          setProcessingStage(2);
          await new Promise((r) => setTimeout(r, 600));
          setProcessingStage(3);
          const res = await processImages(uploadResp.task_id, mode, expectedPct);
          setProcessingStage(4);
          await new Promise((r) => setTimeout(r, 400));
          return res;
        })(),
        {
          loading: 'Running CV pipeline…',
          success: 'Analysis complete!',
          error: (err) => `Error: ${err?.response?.data?.detail ?? err.message}`,
        },
      ).then((res) => {
        setResult(res);
        setAppState('done');
      }).catch(() => {
        setAppState('error');
      });

    } catch (err: any) {
      toast.error(`Upload failed: ${err?.response?.data?.detail ?? err.message}`);
      setAppState('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setAppState('idle');
    setProcessingStage(0);
  }, []);

  const isLoading = appState === 'uploading' || appState === 'processing';

  return (
    <div className="min-h-screen bg-surface-900 bg-grid">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1629',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
          },
        }}
      />

      {/* Nav */}
      <Header />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Hero (shown only when idle) ── */}
        <AnimatePresence>
          {appState === 'idle' && <HeroBanner />}
        </AnimatePresence>

        {/* ── Upload + Explainer layout ── */}
        {(appState === 'idle' || appState === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 xl:grid-cols-3 gap-6"
          >
            {/* Upload panel */}
            <div className="xl:col-span-2 glass p-6 space-y-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="section-label">Upload Images</p>
                  <h2 className="text-lg font-bold text-slate-200 mt-0.5">
                    Select aerial images
                  </h2>
                </div>
                <button
                  onClick={() => setShowExplainer(!showExplainer)}
                  className="btn-secondary !px-3 !py-2 xl:hidden"
                >
                  <Info className="w-4 h-4" />
                  How it works
                </button>
              </div>
              <UploadZone onSubmit={handleSubmit} isLoading={isLoading} />
              {appState === 'error' && (
                <p className="text-sm text-red-400 text-center pt-2">
                  Something went wrong. Check that the backend is running on port 8000.
                </p>
              )}
            </div>

            {/* Sidebar: Pipeline explainer (always visible on xl, toggle on smaller) */}
            <div className={`xl:block ${showExplainer ? 'block' : 'hidden xl:block'}`}>
              <PipelineExplainer />
            </div>
          </motion.div>
        )}

        {/* ── Processing overlay ── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <ProcessingOverlay stage={processingStage} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results dashboard ── */}
        <AnimatePresence>
          {appState === 'done' && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsDashboard result={result} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Satellite className="w-3.5 h-3.5 text-brand-600" />
            <span>AerialCV — Aerial Progress Monitoring System</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              LEVIR-CD Dataset
            </span>
            <span>FastAPI + OpenCV + React</span>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
