from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import shutil
import zipfile
import tarfile
import uuid
import subprocess

from process_ndjson import process_gitlab_export

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure temp_uploads directory exists
Path("temp_uploads").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="temp_uploads"), name="static")

@app.post("/process")
async def upload_gitlab_export(file: UploadFile = File(...)):
    temp_id = str(uuid.uuid4())
    upload_dir = Path("temp_uploads") / temp_id
    extract_dir = upload_dir / "unzipped"
    output_dir = upload_dir / "output"
    gitstats_repo = upload_dir / "gitstats_repo"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file
    zip_path = upload_dir / file.filename
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract
    if zip_path.suffix == ".zip":
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
    elif zip_path.suffixes[-2:] == [".tar", ".gz"] or zip_path.suffix == ".tgz":
        with tarfile.open(zip_path, "r:gz") as tar_ref:
            tar_ref.extractall(extract_dir)
    else:
        return {"error": "Unsupported archive format. Use .zip or .tar.gz"}

    # ---- GitStats Section ----
    project_bundle = next(extract_dir.glob("**/project.bundle"), None)
    gitstats_url = None

    if project_bundle:
        gitstats_repo.mkdir(parents=True, exist_ok=True)
        try:
            subprocess.run(["git", "clone", str(project_bundle), "."], cwd=gitstats_repo, check=True)
            subprocess.run(["gitstats", str(gitstats_repo), str(output_dir / "gitstats_report")], check=True)
            gitstats_url = f"/static/{temp_id}/output/gitstats_report/index.html"
        except subprocess.CalledProcessError as e:
            print("GitStats failed:", e)
    else:
        print("No project.bundle found.")

    # Process the NDJSON files into CSVs
    result_paths = process_gitlab_export(extract_dir, output_dir)

    return {
        "message": "Processed successfully",
        "files": {
            "issues": f"/static/{temp_id}/output/cleaned_issues.csv",
            "merge_requests": f"/static/{temp_id}/output/cleaned_merge_requests.csv",
            "comments": f"/static/{temp_id}/output/all_comments.csv",
            "gitstats_report": gitstats_url
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=10000)