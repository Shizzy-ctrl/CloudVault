import shutil
import os
import uuid
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, UploadFile, File, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import User, FileRecord, Share
from app.schemas import ShareResponse, ShareUpdate, FileResponse
from app.auth import get_current_user, get_password_hash

router = APIRouter()

FILES_DIR = "files"

@router.post("/upload", response_model=ShareResponse)
async def upload_files(
    request: Request,
    files: List[UploadFile] = File(...), 
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    os.makedirs(FILES_DIR, exist_ok=True)
    
    # Create a new Share
    new_share = Share(owner_id=current_user.id)
    db.add(new_share)
    await db.flush() # get ID

    uploaded_files = []

    for file in files:
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(FILES_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        db_file = FileRecord(
            filename=file.filename,
            file_path=file_path,
            share_id=new_share.id
        )
        db.add(db_file)
        uploaded_files.append(db_file)
    
    await db.commit()
    await db.refresh(new_share)
    
    base_url = os.getenv("BASE_URL", "http://localhost:3000")
    if not base_url.endswith("/"):
        base_url += "/"
    share_link = f"{base_url}download/{new_share.public_id}"
    
    # Construct response manually to avoid validation issues with lazy loading
    return ShareResponse(
        public_id=new_share.public_id,
        share_link=share_link,
        files=[FileResponse(id=f.id, filename=f.filename) for f in uploaded_files],
        expires_at=new_share.expires_at,
        password_protected=bool(new_share.password_hash)
    )

@router.post("/share/{public_id}")
async def update_share_settings(
    public_id: str,
    share_settings: ShareUpdate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    print(f"DEBUG: update_share_settings for {public_id}, settings: {share_settings}")
    
    result = await db.execute(select(Share).where(Share.public_id == public_id, Share.owner_id == current_user.id))
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
        
    if share_settings.password is not None: # Check for not None to allow empty string to clear? Logic above suggests setting pwd.
        if share_settings.password == "":
             share.password_hash = None
        else:
             share.password_hash = get_password_hash(share_settings.password)
        
    if share_settings.expires_minutes is not None:
        share.expires_at = datetime.utcnow() + timedelta(minutes=share_settings.expires_minutes)
        
    await db.commit()
    
    return {"message": "Share settings updated"}
