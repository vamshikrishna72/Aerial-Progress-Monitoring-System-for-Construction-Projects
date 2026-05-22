"""
cv_pipeline.py - Core Computer Vision Pipeline
Implements: Preprocessing → Alignment → Change Detection → Progress Estimation
"""
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from utils import apply_heatmap, overlay_heatmap, draw_contours

TARGET_SIZE = (512, 512)

# ── 1. PREPROCESSING ─────────────────────────────────────────────────────────
def preprocess(img):
    """Resize, convert to grayscale, blur, and normalize brightness."""
    img = cv2.resize(img, TARGET_SIZE)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    # CLAHE for local contrast/brightness normalization
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    normalized = clahe.apply(blurred)
    return img, normalized

# ── 2. ALIGNMENT (ORB + Homography) ──────────────────────────────────────────
def align_images(img_ref_gray, img_tgt, img_tgt_gray):
    """
    Align img_tgt to img_ref using ORB feature matching + RANSAC homography.
    Returns the warped color image and warped grayscale image.
    """
    orb = cv2.ORB_create(nfeatures=3000)
    kp1, des1 = orb.detectAndCompute(img_ref_gray, None)
    kp2, des2 = orb.detectAndCompute(img_tgt_gray, None)

    if des1 is None or des2 is None or len(kp1) < 10 or len(kp2) < 10:
        # Not enough features — return original (no alignment possible)
        return img_tgt, img_tgt_gray, None, 0

    matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    raw_matches = matcher.knnMatch(des1, des2, k=2)

    # Lowe's ratio test to filter poor matches
    good = [m for m, n in raw_matches if m.distance < 0.75 * n.distance]

    if len(good) < 10:
        return img_tgt, img_tgt_gray, None, len(good)

    src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)
    if H is None:
        return img_tgt, img_tgt_gray, None, len(good)

    h, w = TARGET_SIZE
    aligned_color = cv2.warpPerspective(img_tgt, H, (w, h))
    aligned_gray = cv2.warpPerspective(img_tgt_gray, H, (w, h))

    return aligned_color, aligned_gray, H, len(good)


# ── 3. EDGE DETECTION (Canny) ─────────────────────────────────────────────────
def detect_edges(gray_img):
    """Apply Canny edge detection."""
    edges = cv2.Canny(gray_img, threshold1=50, threshold2=150)
    return edges


# ── 4. CHANGE DETECTION ───────────────────────────────────────────────────────
def detect_changes_absdiff(gray1, gray2):
    """
    Classical absolute difference change detection.
    Returns: (diff_image, binary_mask, change_percentage)
    """
    diff = cv2.absdiff(gray1, gray2)
    _, binary = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
    # Morphological cleanup — remove noise, fill gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    change_pct = (np.count_nonzero(binary) / binary.size) * 100
    return diff, binary, round(change_pct, 2)


def detect_changes_ssim(gray1, gray2):
    """
    SSIM-based change detection for structural accuracy.
    Low SSIM score regions are treated as changed areas.
    """
    score, ssim_map = ssim(gray1, gray2, full=True)
    ssim_map = (ssim_map * 255).astype(np.uint8)
    diff = 255 - ssim_map  # Invert: high diff = low similarity
    _, binary = cv2.threshold(diff, 40, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    change_pct = (np.count_nonzero(binary) / binary.size) * 100
    return diff, binary, round(change_pct, 2), round(float(score), 4)


# ── 5. PROGRESS ESTIMATION ────────────────────────────────────────────────────
def estimate_progress(change_pct, expected_pct=None):
    """
    Estimate construction progress from change percentage.
    Optionally compare against expected progress.
    """
    result = {
        "change_percentage": change_pct,
        "progress_label": "",
        "status": "",
        "deviation": None,
    }

    if change_pct < 2:
        result["progress_label"] = "No Significant Change"
        result["status"] = "stable"
    elif change_pct < 10:
        result["progress_label"] = "Minor Activity Detected"
        result["status"] = "low"
    elif change_pct < 25:
        result["progress_label"] = "Moderate Construction Progress"
        result["status"] = "medium"
    elif change_pct < 50:
        result["progress_label"] = "Significant Construction Activity"
        result["status"] = "high"
    else:
        result["progress_label"] = "Major Structural Transformation"
        result["status"] = "critical"

    if expected_pct is not None:
        result["deviation"] = round(change_pct - expected_pct, 2)
        if result["deviation"] >= 0:
            result["timeline_status"] = "On Track / Ahead"
        else:
            result["timeline_status"] = "Behind Schedule"

    return result


# ── 6. FULL PIPELINE RUNNER ───────────────────────────────────────────────────
def run_pipeline(img1_path, img2_path, mode="absdiff", expected_pct=None):
    """
    Full end-to-end pipeline.
    Args:
        img1_path: Path to earlier image (t1)
        img2_path: Path to later image (t2)
        mode: 'absdiff' or 'ssim'
        expected_pct: Optional expected progress % for timeline comparison
    Returns: dict with all processed images (base64) and metrics
    """
    import cv2
    from utils import image_to_base64, load_image

    # Load original images
    img1 = load_image(img1_path)
    img2 = load_image(img2_path)

    # Step 1: Preprocess both
    img1_color, img1_gray = preprocess(img1)
    img2_color, img2_gray = preprocess(img2)

    # Step 2: Align img2 to img1
    img2_aligned_color, img2_aligned_gray, homography, match_count = align_images(
        img1_gray, img2_color, img2_gray
    )

    # Step 3: Edge detection on both
    edges1 = detect_edges(img1_gray)
    edges2 = detect_edges(img2_aligned_gray)

    # Step 4: Change detection
    ssim_score = None
    if mode == "ssim":
        diff, binary_mask, change_pct, ssim_score = detect_changes_ssim(img1_gray, img2_aligned_gray)
    else:
        diff, binary_mask, change_pct = detect_changes_absdiff(img1_gray, img2_aligned_gray)

    # Step 5: Build heatmap and overlays
    heatmap = apply_heatmap(diff)
    heatmap_overlay = overlay_heatmap(img1_color, heatmap, alpha=0.55)
    annotated_img2, region_count = draw_contours(img2_aligned_color, binary_mask)

    # Step 6: Progress estimation
    metrics = estimate_progress(change_pct, expected_pct)
    metrics["match_count"] = match_count
    metrics["aligned"] = homography is not None
    metrics["mode"] = mode
    if ssim_score is not None:
        metrics["ssim_score"] = ssim_score
    metrics["region_count"] = region_count

    return {
        "images": {
            "before": image_to_base64(img1_color),
            "after": image_to_base64(img2_aligned_color),
            "diff": image_to_base64(diff if len(diff.shape) == 3 else cv2.cvtColor(diff, cv2.COLOR_GRAY2BGR)),
            "binary_mask": image_to_base64(cv2.cvtColor(binary_mask, cv2.COLOR_GRAY2BGR)),
            "heatmap": image_to_base64(heatmap),
            "heatmap_overlay": image_to_base64(heatmap_overlay),
            "edges_before": image_to_base64(cv2.cvtColor(edges1, cv2.COLOR_GRAY2BGR)),
            "edges_after": image_to_base64(cv2.cvtColor(edges2, cv2.COLOR_GRAY2BGR)),
            "annotated": image_to_base64(annotated_img2),
        },
        "metrics": metrics,
    }


# ── 7. MULTI-TIME ANALYSIS ────────────────────────────────────────────────────
def run_multi_time_pipeline(image_paths, mode="absdiff"):
    """
    Analyze progress across multiple time points (t1 → t2 → t3 → ...).
    Returns list of results for each consecutive pair.
    """
    results = []
    for i in range(len(image_paths) - 1):
        r = run_pipeline(image_paths[i], image_paths[i + 1], mode=mode)
        r["time_step"] = f"t{i+1} → t{i+2}"
        results.append(r)
    return results
