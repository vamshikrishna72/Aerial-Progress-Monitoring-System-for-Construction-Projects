"""
app.py - FastAPI Backend for Aerial Progress Monitoring System
Endpoints: /upload, /process, /results/{task_id}, /multi-process
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import asyncio

from utils import generate_task_id, save_upload, load_metadata, save_metadata, UPLOAD_DIR
from cv_pipeline import run_pipeline, run_multi_time_pipeline

app = FastAPI(
    title="Aerial Progress Monitoring API",
    description="Computer Vision pipeline for construction site change detection",
    version="1.0.0",
)

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory task store (task_id -> file paths)
task_store: dict = {}


@app.get("/")
def root():
    return {"status": "ok", "message": "Aerial Progress Monitoring API is running."}


@app.post("/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    """
    Upload 2+ aerial images.
    Returns a task_id to be used in /process.
    """
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 images are required.")
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed.")

    task_id = generate_task_id()
    saved_paths = []

    for f in files:
        content = await f.read()
        if len(content) > 20 * 1024 * 1024:  # 20MB limit per file
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 20MB.")
        path = save_upload(content, f.filename, task_id)
        saved_paths.append(str(path))

    task_store[task_id] = saved_paths

    return {
        "task_id": task_id,
        "file_count": len(saved_paths),
        "filenames": [os.path.basename(p) for p in saved_paths],
    }


@app.post("/process")
async def process_images(
    task_id: str = Form(...),
    mode: str = Form("absdiff"),
    expected_pct: Optional[float] = Form(None),
):
    """
    Run the CV pipeline on previously uploaded images.
    mode: 'absdiff' | 'ssim'
    expected_pct: Optional expected progress % for timeline comparison.
    """
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found. Please upload images first.")

    paths = task_store[task_id]
    if len(paths) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 images.")

    valid_modes = ["absdiff", "ssim"]
    if mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"mode must be one of {valid_modes}")

    try:
        # Run blocking CV pipeline in thread pool so it doesn't block the event loop
        loop = asyncio.get_event_loop()

        if len(paths) == 2:
            result = await loop.run_in_executor(
                None,
                lambda: run_pipeline(paths[0], paths[1], mode=mode, expected_pct=expected_pct),
            )
            result["type"] = "pairwise"
            result["task_id"] = task_id
        else:
            # Multi-time analysis
            result_list = await loop.run_in_executor(
                None,
                lambda: run_multi_time_pipeline(paths, mode=mode),
            )
            result = {
                "type": "multi_time",
                "task_id": task_id,
                "steps": result_list,
                "total_steps": len(result_list),
            }

        # Cache metrics (without image data to save space)
        meta = {
            "task_id": task_id,
            "mode": mode,
            "type": result["type"],
            "metrics": result.get("metrics", {}),
        }
        save_metadata(meta, task_id)

        return JSONResponse(content=result)

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@app.get("/results/{task_id}")
def get_results(task_id: str):
    """Retrieve cached metrics for a completed task."""
    try:
        meta = load_metadata(task_id)
        return meta
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Results not found.")


@app.delete("/task/{task_id}")
def delete_task(task_id: str):
    """Clean up uploaded files and results for a task."""
    from utils import cleanup_task
    if task_id in task_store:
        del task_store[task_id]
    cleanup_task(task_id)
    return {"message": f"Task {task_id} deleted."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
