import os, uuid, base64, shutil, json
from pathlib import Path
from datetime import datetime
import cv2, numpy as np

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
RESULTS_DIR = BASE_DIR / "results"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def generate_task_id():
    return f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

def get_task_dir(task_id):
    d = RESULTS_DIR / task_id
    d.mkdir(parents=True, exist_ok=True)
    return d

def save_upload(file_bytes, filename, task_id):
    d = UPLOAD_DIR / task_id
    d.mkdir(parents=True, exist_ok=True)
    p = d / Path(filename).name
    p.write_bytes(file_bytes)
    return p

def image_to_base64(image, ext=".jpg"):
    params = [cv2.IMWRITE_JPEG_QUALITY, 90] if ext == ".jpg" else []
    ok, buf = cv2.imencode(ext, image, params)
    if not ok:
        raise ValueError("Encode failed")
    b64 = base64.b64encode(buf).decode()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    return f"data:{mime};base64,{b64}"

def load_image(path):
    img = cv2.imread(str(path))
    if img is None:
        raise FileNotFoundError(f"Cannot load: {path}")
    return img

def save_result_image(image, task_id, name):
    p = get_task_dir(task_id) / f"{name}.jpg"
    cv2.imwrite(str(p), image)
    return p

def save_metadata(meta, task_id):
    p = get_task_dir(task_id) / "metadata.json"
    p.write_text(json.dumps(meta, indent=2))
    return p

def load_metadata(task_id):
    p = RESULTS_DIR / task_id / "metadata.json"
    if not p.exists():
        raise FileNotFoundError(f"No results for task: {task_id}")
    return json.loads(p.read_text())

def apply_heatmap(gray_mask):
    norm = cv2.normalize(gray_mask, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return cv2.applyColorMap(norm, cv2.COLORMAP_JET)

def overlay_heatmap(base, heatmap, alpha=0.5):
    if base.shape[:2] != heatmap.shape[:2]:
        heatmap = cv2.resize(heatmap, (base.shape[1], base.shape[0]))
    return cv2.addWeighted(base, 1 - alpha, heatmap, alpha, 0)

def draw_contours(base, binary_mask):
    result = base.copy()
    cnts, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    significant = [c for c in cnts if cv2.contourArea(c) > 100]
    cv2.drawContours(result, significant, -1, (0, 255, 0), 2)
    return result, len(significant)
