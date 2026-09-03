import uvicorn

def main():
    print("Starting PRISM Production Server on http://0.0.0.0:8000 ...")
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
