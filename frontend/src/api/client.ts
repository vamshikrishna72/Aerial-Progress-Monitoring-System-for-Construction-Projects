// ─────────────────────────────────────────────────────────────
// api/client.ts  — Axios client & typed API calls
// ─────────────────────────────────────────────────────────────
import axios from 'axios';
import type {
  UploadResponse,
  ProcessResult,
  DetectionMode,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

const http = axios.create({
  baseURL: BASE,
  timeout: 120_000,  // 2 min — CV pipeline can be slow on large images
});

/** Upload 2+ image files. Returns a task_id. */
export async function uploadImages(files: File[]): Promise<UploadResponse> {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const { data } = await http.post<UploadResponse>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Trigger the CV pipeline on a previously uploaded task. */
export async function processImages(
  taskId: string,
  mode: DetectionMode,
  expectedPct?: number,
): Promise<ProcessResult> {
  const form = new FormData();
  form.append('task_id', taskId);
  form.append('mode', mode);
  if (expectedPct != null) form.append('expected_pct', String(expectedPct));
  const { data } = await http.post<ProcessResult>('/process', form);
  return data;
}

/** Get cached metadata for a completed task. */
export async function getResults(taskId: string) {
  const { data } = await http.get(`/results/${taskId}`);
  return data;
}

/** Delete task files from server. */
export async function deleteTask(taskId: string) {
  await http.delete(`/task/${taskId}`);
}
