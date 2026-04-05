import uvicorn
import os

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        import asyncio
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    os.environ["HF_HUB_ENABLE_HF_TRANSFER"] = "1"
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, log_level="info")
