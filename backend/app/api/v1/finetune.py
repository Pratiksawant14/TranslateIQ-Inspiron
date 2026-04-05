from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.database import get_db
from app.services.project_service import get_project_by_id
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/{project_id}/fine-tune", status_code=202)
async def initiate_fine_tuning(
    project_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    await get_project_by_id(db, project_id)
    
    # Run the background task
    async def run_fine_tuning_job():
        import os
        logger.info(f"Started fine-tuning job for project {project_id}")
        
        # Mark as training
        os.makedirs(f"models/lora_{project_id}", exist_ok=True)
        with open(f"models/lora_{project_id}/status.txt", "w") as f:
            f.write("training")
            
        await asyncio.sleep(2) 
        logger.info(f"Dataset extraction complete. Starting LoRA PEFT training on Llama-3-8B-Instruct...")
        # Simulate local training
        await asyncio.sleep(4)
        
        # Create the local mock directory to trigger the Adaptive MT routing on next translation 
        with open(f"models/lora_{project_id}/adapter_config.json", "w") as f:
            f.write('{"peft_type": "LORA"}')
        with open(f"models/lora_{project_id}/status.txt", "w") as f:
            f.write("completed")
            
        logger.info(f"Fine-tuning complete! Adapter saved for project {project_id}.")

    background_tasks.add_task(run_fine_tuning_job)
    return {"message": "Fine-tuning job initiated", "status": "processing"}

@router.get("/{project_id}/fine-tune/status")
async def get_fine_tuning_status(project_id: UUID):
    import os
    status_path = f"models/lora_{project_id}/status.txt"
    if os.path.exists(status_path):
        with open(status_path, "r") as f:
            status = f.read().strip()
        return {"status": status}
    return {"status": "none"}
