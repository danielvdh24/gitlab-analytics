# backend/main.py

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import zipfile
import uuid

from process_ndjson import process_gitlab_export

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def upload_gitlab_export(file: UploadFile = File(...)):
    temp_id = str(uuid.uuid4())
    upload_dir = Path("temp_uploads") / temp_id
    extract_dir = upload_dir / "unzipped"
    output_dir = upload_dir / "output"
    upload_dir.mkdir(parents=True, exist_ok=True)

    zip_path = upload_dir / file.filename
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

    result = process_gitlab_export(extract_dir, output_dir)
    return {
        "message": "Processed successfully",
        "files": result
    }
