import shutil
import os
import uuid
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, UploadFile, File, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.models import User, FileRecord, Share
from app.schemas import ShareResponse, ShareUpdate, FileResponse, ShareListItem
from app.auth import get_current_user, get_password_hash
from app.logging_utils import log_event

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
    
    # Create a new Share with default 30-minute expiration
    new_share = Share(
        owner_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=30)
    )
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
    
    # Log the upload event
    log_event("upload", {
        "username": current_user.username,
        "share_id": new_share.public_id,
        "files": [f.filename for f in uploaded_files]
    }, request)
    
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
        if share_settings.expires_minutes > 1440:
             raise HTTPException(status_code=400, detail="Expiration time cannot exceed 1 day (1440 minutes)")
        share.expires_at = datetime.utcnow() + timedelta(minutes=share_settings.expires_minutes)
        
    await db.commit()
    
    return {"message": "Share settings updated"}

@router.get("/shares", response_model=List[ShareListItem])
async def get_user_shares(
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Share)
        .options(selectinload(Share.files))
        .where(Share.owner_id == current_user.id)
        .order_by(Share.created_at.desc())
    )
    shares = result.scalars().all()
    
    base_url = os.getenv("BASE_URL", "http://localhost:3000")
    if not base_url.endswith("/"):
        base_url += "/"
    
    share_list = []
    for share in shares:
        share_list.append(ShareListItem(
            public_id=share.public_id,
            share_link=f"{base_url}download/{share.public_id}",
            file_count=len(share.files),
            expires_at=share.expires_at,
            password_protected=bool(share.password_hash),
            created_at=share.created_at,
            is_shared=share.is_shared
        ))
    
    return share_list

@router.get("/share/{public_id}", response_model=ShareResponse)
async def get_share_details(
    public_id: str,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Share)
        .options(selectinload(Share.files))
        .where(Share.public_id == public_id, Share.owner_id == current_user.id)
    )
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    base_url = os.getenv("BASE_URL", "http://localhost:3000")
    if not base_url.endswith("/"):
        base_url += "/"
    
    return ShareResponse(
        public_id=share.public_id,
        share_link=f"{base_url}download/{share.public_id}",
        files=[FileResponse(id=f.id, filename=f.filename) for f in share.files],
        expires_at=share.expires_at,
        password_protected=bool(share.password_hash),
        created_at=share.created_at,
        is_shared=share.is_shared
    )

@router.delete("/share/{public_id}")
async def delete_share(
    public_id: str,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Share)
        .options(selectinload(Share.files))
        .where(Share.public_id == public_id, Share.owner_id == current_user.id)
    )
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Delete files from filesystem
    for file_record in share.files:
        try:
            if os.path.exists(file_record.file_path):
                os.remove(file_record.file_path)
        except Exception as e:
            print(f"Error deleting file {file_record.file_path}: {e}")
    
    # Delete share and associated files (cascade will handle files in DB)
    await db.delete(share)
    await db.commit()
    
    return {"message": "Share deleted successfully"}

@router.post("/share/{public_id}/files", response_model=ShareResponse)
async def add_files_to_share(
    public_id: str,
    request: Request,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Share)
        .options(selectinload(Share.files))
        .where(Share.public_id == public_id, Share.owner_id == current_user.id)
    )
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    os.makedirs(FILES_DIR, exist_ok=True)
    
    uploaded_files = []
    for file in files:
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(FILES_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        db_file = FileRecord(
            filename=file.filename,
            file_path=file_path,
            share_id=share.id
        )
        db.add(db_file)
        uploaded_files.append(db_file)
    
    await db.commit()
    await db.refresh(share)
    
    # Log the file addition event
    log_event("add_files", {
        "username": current_user.username,
        "share_id": share.public_id,
        "files": [f.filename for f in uploaded_files]
    }, request)
    
    base_url = os.getenv("BASE_URL", "http://localhost:3000")
    if not base_url.endswith("/"):
        base_url += "/"
    
    return ShareResponse(
        public_id=share.public_id,
        share_link=f"{base_url}download/{share.public_id}",
        files=[FileResponse(id=f.id, filename=f.filename) for f in share.files],
        expires_at=share.expires_at,
        password_protected=bool(share.password_hash),
        created_at=share.created_at,
        is_shared=share.is_shared
    )

@router.delete("/share/{public_id}/file/{file_id}")
async def delete_file_from_share(
    public_id: str,
    file_id: int,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Share).where(Share.public_id == public_id, Share.owner_id == current_user.id)
    )
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.share_id == share.id)
    )
    file_record = result.scalars().first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete file from filesystem
    try:
        if os.path.exists(file_record.file_path):
            os.remove(file_record.file_path)
    except Exception as e:
        print(f"Error deleting file {file_record.file_path}: {e}")
    
    # Delete file from database
    await db.delete(file_record)
    await db.commit()
    
    return {"message": "File deleted successfully"}
