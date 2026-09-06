import os
import sys
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    venv_python = root_dir / ".venv" / "bin" / "python"
    if venv_python.exists() and sys.executable != str(venv_python):
        os.execv(str(venv_python), [str(venv_python)] + sys.argv)

    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))

    import uvicorn
    print("🚀 Starting Sentrix Backend Server on http://0.0.0.0:8000 ...")
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(root_dir / "backend")]
    )

if __name__ == "__main__":
    main()

