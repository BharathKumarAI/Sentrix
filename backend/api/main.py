import sys
from pathlib import Path

# Ensure project root directory is on sys.path so 'backend.*' imports resolve cleanly
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.server import app

__all__ = ["app"]
