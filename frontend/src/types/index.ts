// ─────────────────────────────────────────────────────────────
// types/index.ts  — Shared TypeScript types for the app
// ─────────────────────────────────────────────────────────────

/** Metrics returned by the CV pipeline */
export interface Metrics {
  change_percentage: number;
  progress_label: string;
  status: 'stable' | 'low' | 'medium' | 'high' | 'critical';
  deviation: number | null;
  timeline_status?: string;
  match_count: number;
  aligned: boolean;
  mode: 'absdiff' | 'ssim';
  ssim_score?: number;
  region_count: number;
}

/** Image bundle returned by /process (pairwise) */
export interface ImageBundle {
  before: string;           // base64 data URL
  after: string;
  diff: string;
  binary_mask: string;
  heatmap: string;
  heatmap_overlay: string;
  edges_before: string;
  edges_after: string;
  annotated: string;
}

/** Single pairwise result */
export interface PairwiseResult {
  type: 'pairwise';
  task_id: string;
  images: ImageBundle;
  metrics: Metrics;
}

/** One step of multi-time analysis */
export interface TimeStep {
  time_step: string;     // e.g. "t1 → t2"
  images: ImageBundle;
  metrics: Metrics;
}

/** Multi-time result */
export interface MultiTimeResult {
  type: 'multi_time';
  task_id: string;
  steps: TimeStep[];
  total_steps: number;
}

export type ProcessResult = PairwiseResult | MultiTimeResult;

/** Upload response */
export interface UploadResponse {
  task_id: string;
  file_count: number;
  filenames: string[];
}

/** App processing state */
export type AppState =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

/** Detection mode */
export type DetectionMode = 'absdiff' | 'ssim';

/** Which overlay view is active */
export type OverlayView =
  | 'comparison'
  | 'heatmap'
  | 'binary_mask'
  | 'edges'
  | 'annotated';
