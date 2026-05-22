// ─────────────────────────────────────────────────────────────
// components/UploadZone.tsx
// ─────────────────────────────────────────────────────────────
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Image as ImageIcon, X, ChevronRight,
  Settings2, Zap, Brain, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import type { DetectionMode } from '../types';

interface Props {
  onSubmit: (files: File[], mode: DetectionMode, expectedPct?: number) => void;
  isLoading: boolean;
}

export default function UploadZone({ onSubmit, isLoading }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mode, setMode] = useState<DetectionMode>('absdiff');
  const [expectedPct, setExpectedPct] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = [...files, ...accepted].slice(0, 10);
    setFiles(newFiles);
    // Generate preview URLs
    newFiles.forEach((f, i) => {
      if (!previews[i]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews((prev) => {
            const next = [...prev];
            next[i] = e.target?.result as string;
            return next;
          });
        };
        reader.readAsDataURL(f);
      }
    });
  }, [files, previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.tif', '.tiff'] },
    multiple: true,
    disabled: isLoading,
  });

  const removeFile = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (files.length < 2) return;
    const pct = expectedPct ? parseFloat(expectedPct) : undefined;
    onSubmit(files, mode, pct);
  };

  return (
    <div className="space-y-6">
      {/* ── Drop area ── */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group',
          isDragActive
            ? 'border-brand-400 bg-brand-500/5 dropzone-active'
            : 'border-surface-500 hover:border-brand-600/70 hover:bg-surface-700/30',
          isLoading && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />

        {/* Background glow on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 glow-orb-blue pointer-events-none" />

        <div className="relative flex flex-col items-center gap-4">
          <div className={clsx(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
            isDragActive
              ? 'bg-brand-500/20 scale-110'
              : 'bg-surface-600/60 group-hover:bg-brand-600/20 group-hover:scale-105',
          )}>
            <Upload className={clsx(
              'w-7 h-7 transition-colors duration-300',
              isDragActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-brand-400',
            )} />
          </div>

          <div>
            <p className="text-base font-semibold text-slate-200">
              {isDragActive ? 'Drop images here…' : 'Drag & drop aerial images'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or <span className="text-brand-400 font-medium">click to browse</span> · PNG, JPG, TIFF · 20 MB max
            </p>
          </div>

          <div className="flex gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />Min 2 images</span>
            <span>·</span>
            <span>Max 10 images</span>
            <span>·</span>
            <span>Ordered by time (t1 → t2…)</span>
          </div>
        </div>
      </div>

      {/* ── File previews ── */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                className="relative group rounded-xl overflow-hidden border border-surface-500 bg-surface-700 aspect-square"
              >
                {previews[i] ? (
                  <img
                    src={previews[i]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-600" />
                  </div>
                )}

                {/* Time label */}
                <div className="absolute top-1.5 left-1.5">
                  <span className="badge-blue text-[10px] px-1.5 py-0.5">t{i + 1}</span>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  disabled={isLoading}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Filename */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-[10px] text-white truncate font-mono">{file.name}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings ── */}
      <div className="glass-sm p-5 space-y-5">
        {/* Detection mode */}
        <div>
          <p className="section-label mb-3">Detection Mode</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'absdiff' as DetectionMode,
                icon: Zap,
                label: 'Quick Compare',
                desc: 'Instantly scans for basic visual differences',
                color: 'brand',
              },
              {
                id: 'ssim' as DetectionMode,
                icon: Brain,
                label: 'Deep Analysis',
                desc: 'Smart AI that understands structural changes',
                color: 'purple',
              },
            ].map(({ id, icon: Icon, label, desc, color }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                disabled={isLoading}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200',
                  mode === id
                    ? color === 'brand'
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-purple-500 bg-purple-500/10'
                    : 'border-surface-500 bg-surface-700/40 hover:border-surface-400',
                )}
              >
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  mode === id
                    ? color === 'brand' ? 'bg-brand-500/20 text-brand-400' : 'bg-purple-500/20 text-purple-400'
                    : 'bg-surface-600 text-slate-500',
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={clsx(
                    'text-sm font-semibold',
                    mode === id ? (color === 'brand' ? 'text-brand-300' : 'text-purple-300') : 'text-slate-300',
                  )}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced toggle */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Advanced options
            <ChevronRight className={clsx('w-4 h-4 transition-transform', showAdvanced && 'rotate-90')} />
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <label className="block">
                  <span className="text-xs text-slate-400 font-medium">
                    Expected Progress % (Optional)
                  </span>
                  <div className="relative mt-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={expectedPct}
                      onChange={(e) => setExpectedPct(e.target.value)}
                      placeholder="e.g. 35"
                      disabled={isLoading}
                      className="w-full bg-surface-800 border border-surface-500 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Tell us what % of progress you expect to see by this date. Our AI will tell you if you are on track!
                  </p>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Validation warning ── */}
      <AnimatePresence>
        {files.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Add at least one more image to enable change detection.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit button ── */}
      <motion.button
        onClick={handleSubmit}
        disabled={files.length < 2 || isLoading}
        className="btn-primary w-full justify-center py-3.5 text-base"
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <>
            <span className="spin-ring w-5 h-5" />
            Processing…
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Run CV Pipeline
            {files.length >= 2 && (
              <span className="ml-auto badge-blue !text-[10px]">
                {files.length} images
              </span>
            )}
          </>
        )}
      </motion.button>
    </div>
  );
}
