#!/usr/bin/env python3
"""
Sentrix Cloud Dependency Installer.
Installs Python dependencies tailored to your targeted cloud environment:
- local / core (FastAPI, ADK 2.8, SQLite/PostgreSQL, OpenTelemetry)
- azure (Azure Blob Storage, Key Vault, Identity)
- gcp (Google Cloud Storage, Secret Manager, Cloud Logging/Trace)
- aws (Boto3, Botocore)
- k8s (Kubernetes Python Client)
- all (All cloud providers combined)
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = REPO_ROOT / "backend"

CLOUD_REQUIREMENTS_MAP = {
    "local": BACKEND_DIR / "requirements.txt",
    "core": BACKEND_DIR / "requirements.txt",
    "azure": BACKEND_DIR / "requirements-azure.txt",
    "gcp": BACKEND_DIR / "requirements-gcp.txt",
    "aws": BACKEND_DIR / "requirements-aws.txt",
    "k8s": BACKEND_DIR / "requirements-k8s.txt",
    "all": BACKEND_DIR / "requirements-all.txt",
}


def detect_installer(preferred: str = "auto") -> str:
    """Detect whether to use uv or pip."""
    if preferred != "auto":
        return preferred
    if shutil.which("uv"):
        return "uv"
    return "pip"


def install_dependencies(cloud: str, tool: str = "auto") -> int:
    """Install dependencies for the specified cloud target."""
    cloud = cloud.lower().strip()
    if cloud not in CLOUD_REQUIREMENTS_MAP:
        print(f"❌ Error: Unknown cloud target '{cloud}'.")
        print(f"   Available targets: {', '.join(CLOUD_REQUIREMENTS_MAP.keys())}")
        return 1

    req_file = CLOUD_REQUIREMENTS_MAP[cloud]
    if not req_file.exists():
        print(f"❌ Error: Requirements file not found at: {req_file}")
        return 1

    installer = detect_installer(tool)
    print(f"\n📦 Sentrix Cloud Dependency Setup")
    print(f"   Target Cloud: \033[1;36m{cloud.upper()}\033[0m")
    print(f"   Requirements: {req_file.name}")
    print(f"   Installer:    {installer}")
    print("=" * 60)

    if installer == "uv":
        cmd = ["uv", "pip", "install", "-r", str(req_file)]
    else:
        cmd = [sys.executable, "-m", "pip", "install", "-r", str(req_file)]

    try:
        res = subprocess.run(cmd, cwd=str(BACKEND_DIR))
        if res.returncode == 0:
            print("=" * 60)
            print(f"✅ Successfully installed dependencies for \033[1;32m{cloud.upper()}\033[0m!")
            return 0
        else:
            print(f"❌ Installation exited with status code {res.returncode}")
            return res.returncode
    except Exception as e:
        print(f"❌ Failed to execute installer: {e}")
        return 1


def main():
    parser = argparse.ArgumentParser(description="Install Sentrix dependencies based on cloud target.")
    parser.add_argument(
        "--cloud",
        choices=["local", "core", "azure", "gcp", "aws", "k8s", "all"],
        help="Target cloud provider to install dependencies for"
    )
    parser.add_argument(
        "--tool",
        choices=["auto", "uv", "pip"],
        default="auto",
        help="Package installer to use (default: auto-detect uv or pip)"
    )

    args = parser.parse_args()

    if not args.cloud:
        print("\n=======================================================")
        print("  Sentrix Cloud Dependency Configuration Selector")
        print("=======================================================")
        print("1. local  - Core platform only (FastAPI, ADK 2.8, SQLite/Postgres)")
        print("2. azure  - Microsoft Azure (Blob Storage, Key Vault, Identity)")
        print("3. gcp    - Google Cloud Platform (Storage, Secret Manager, Trace)")
        print("4. aws    - Amazon Web Services (S3, Secrets Manager, CloudWatch)")
        print("5. k8s    - Kubernetes Pod Operator & Native Client")
        print("6. all    - All cloud providers & enterprise orchestrators")
        print("=======================================================")
        choice = input("Select cloud target [1-6] (default: 1): ").strip()

        mapping = {
            "1": "local",
            "2": "azure",
            "3": "gcp",
            "4": "aws",
            "5": "k8s",
            "6": "all",
            "": "local"
        }
        cloud_target = mapping.get(choice, "local")
    else:
        cloud_target = args.cloud

    sys.exit(install_dependencies(cloud_target, args.tool))


if __name__ == "__main__":
    main()
