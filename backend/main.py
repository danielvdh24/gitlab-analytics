from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import shutil
import zipfile
import tarfile
import uuid

from process_ndjson import process_gitlab_export

app = FastAPI()

# CORS middleware for local/frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder so frontend can access generated CSV files
app.mount("/static", StaticFiles(directory="temp_uploads"), name="static")

@app.post("/process")
async def upload_gitlab_export(file: UploadFile = File(...)):
    temp_id = str(uuid.uuid4())
    upload_dir = Path("temp_uploads") / temp_id
    extract_dir = upload_dir / "unzipped"
    output_dir = upload_dir / "output"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file
    zip_path = upload_dir / file.filename
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract archive
    if zip_path.suffix == ".zip":
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
    elif zip_path.suffixes[-2:] == [".tar", ".gz"] or zip_path.suffix == ".tgz":
        with tarfile.open(zip_path, "r:gz") as tar_ref:
            tar_ref.extractall(extract_dir)
    else:
        return {"error": "Unsupported archive format. Use .zip or .tar.gz"}

    # Process and return URLs to CSVs
    result_paths = process_gitlab_export(extract_dir, output_dir)
    return {
        "message": "Processed successfully",
        "files": {
            "issues": f"/static/{temp_id}/output/cleaned_issues.csv",
            "merge_requests": f"/static/{temp_id}/output/cleaned_merge_requests.csv",
            "comments": f"/static/{temp_id}/output/all_comments.csv"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000)
