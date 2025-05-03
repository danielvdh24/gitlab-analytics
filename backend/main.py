from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import shutil
import zipfile
import tarfile
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

    # Handle both .zip and .tar.gz
    if zip_path.suffix == ".zip":
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
    elif zip_path.suffixes[-2:] == [".tar", ".gz"] or zip_path.suffix == ".tgz":
        with tarfile.open(zip_path, "r:gz") as tar_ref:
            tar_ref.extractall(extract_dir)
    else:
        return {"error": "Unsupported archive format. Use .zip or .tar.gz"}

    result = process_gitlab_export(extract_dir, output_dir)
    return {
        "message": "Processed successfully",
        "files": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000)