// ─────────────────────────────────────────────────────────────
// components/ImageViewer.tsx
// Interactive before/after comparison + overlay tabs
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Maximize2, X } from 'lucide-react';
import clsx from 'clsx';
import type { ImageBundle, OverlayView } from '../types';

interface Props {
  images: ImageBundle;
  timeLabel?: string;
}

const TABS: { id: OverlayView; label: string; desc: string }[] = [
  { id: 'comparison',  label: 'Before / After',  desc: 'Drag slider to compare' },
  { id: 'heatmap',     label: 'Heatmap Overlay',  desc: 'JET colormap on change intensity' },
  { id: 'binary_mask', label: 'Change Mask',       desc: 'Binary threshold mask' },
  { id: 'edges',       label: 'Edge Detection',    desc: 'Canny edges before & after' },
  { id: 'annotated',   label: 'Annotated',         desc: 'Change contours drawn on image' },
];

function downloadBase64(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function ImageViewer({ images, timeLabel }: Props) {
  const [activeTab, setActiveTab] = useState<OverlayView>('comparison');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const current = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="glass overflow-hidden">
      {/* ── Tab bar ── */}
      <div className="flex overflow-x-auto border-b border-white/[0.06] bg-surface-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
              activeTab === tab.id
                ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-surface-500',
            )}
          >
            {tab.label}
          </button>
        ))}
        {timeLabel && (
          <div className="ml-auto flex items-center pr-4">
            <span className="badge-blue text-xs">{timeLabel}</span>
          </div>
        )}
      </div>

      {/* ── View description ── */}
      <div className="px-4 py-2.5 bg-surface-700/30 border-b border-white/[0.04]">
        <p className="text-xs text-slate-500">{current.desc}</p>
      </div>

      {/* ── Content area ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {activeTab === 'comparison' && (
            <div className="rounded-xl overflow-hidden">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={images.before}
                    alt="Before"
                    style={{ objectFit: 'cover' }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={images.after}
                    alt="After (aligned)"
                    style={{ objectFit: 'cover' }}
                  />
                }
                style={{ height: 400, borderRadius: 12 }}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-2 px-1">
                <span>◀ t1 (Before)</span>
                <span>t2 (After) ▶</span>
              </div>
            </div>
          )}

          {activeTab === 'heatmap' && (
            <SingleImageView
              src={images.heatmap_overlay}
              label="Heatmap Overlay"
              onExpand={() => setLightbox(images.heatmap_overlay)}
              onDownload={() => downloadBase64(images.heatmap_overlay, 'heatmap_overlay.jpg')}
            />
          )}

          {activeTab === 'binary_mask' && (
            <SingleImageView
              src={images.binary_mask}
              label="Binary Change Mask"
              onExpand={() => setLightbox(images.binary_mask)}
              onDownload={() => downloadBase64(images.binary_mask, 'change_mask.jpg')}
            />
          )}

          {activeTab === 'edges' && (
            <div className="grid grid-cols-2 gap-3">
              <SingleImageView
                src={images.edges_before}
                label="Edges t1"
                compact
                onExpand={() => setLightbox(images.edges_before)}
                onDownload={() => downloadBase64(images.edges_before, 'edges_t1.jpg')}
              />
              <SingleImageView
                src={images.edges_after}
                label="Edges t2 (aligned)"
                compact
                onExpand={() => setLightbox(images.edges_after)}
                onDownload={() => downloadBase64(images.edges_after, 'edges_t2.jpg')}
              />
            </div>
          )}

          {activeTab === 'annotated' && (
            <SingleImageView
              src={images.annotated}
              label="Annotated (contours)"
              onExpand={() => setLightbox(images.annotated)}
              onDownload={() => downloadBase64(images.annotated, 'annotated.jpg')}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightbox}
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-component: single image with toolbar ──────────────────
interface SingleImageViewProps {
  src: string;
  label: string;
  compact?: boolean;
  onExpand: () => void;
  onDownload: () => void;
}

function SingleImageView({ src, label, compact, onExpand, onDownload }: SingleImageViewProps) {
  return (
    <div className="relative rounded-xl overflow-hidden group">
      <img
        src={src}
        alt={label}
        className={clsx(
          'w-full object-cover rounded-xl',
          compact ? 'h-48' : 'h-96',
        )}
      />
      {/* Toolbar overlay */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onExpand}
          className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80"
          title="Expand"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDownload}
          className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
      {/* Label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <p className="text-xs text-white font-medium">{label}</p>
      </div>
    </div>
  );
}
