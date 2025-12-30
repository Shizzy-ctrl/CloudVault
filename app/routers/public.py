from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, Body, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from jose import jwt, JWTError

from app.db import get_db
from app.models import Share, FileRecord
from app.auth import verify_password
# Reuse config from main/auth (should be in config file)
SECRET_KEY = "supersecretkeychangedthisinproduction" 
ALGORITHM = "HS256"

router = APIRouter(prefix="/public")

class ShareUnlockRequest(BaseModel):
    password: str

class PublicFile(BaseModel):
    filename: str
    token: str # Signed URL token

class PublicShareResponse(BaseModel):
    locked: bool
    files: List[PublicFile] = []

def create_download_token(file_id: int):
    expire = datetime.utcnow() + timedelta(minutes=60) # Link valid for 1 hour
    to_encode = {"sub": str(file_id), "exp": expire, "type": "download"}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.get("/share/{public_id}", response_model=PublicShareResponse)
async def get_share_status(public_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Share).where(Share.public_id == public_id).options(selectinload(Share.files)))
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    if share.expires_at and share.expires_at < datetime.utcnow():
         raise HTTPException(status_code=410, detail="Link expired")

    if share.password_hash:
        return PublicShareResponse(locked=True)
    
    # Not locked, return files
    files = []
    for f in share.files:
        token = create_download_token(f.id)
        files.append(PublicFile(filename=f.filename, token=token))

    return PublicShareResponse(locked=False, files=files)

@router.post("/share/{public_id}/unlock", response_model=PublicShareResponse)
async def unlock_share(
    public_id: str, 
    body: ShareUnlockRequest = Body(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Share).where(Share.public_id == public_id).options(selectinload(Share.files)))
    share = result.scalars().first()
    
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Link expired")

    if share.password_hash:
        if not body.password or not verify_password(body.password, share.password_hash):
             raise HTTPException(status_code=401, detail="Incorrect Password")

    files = []
    for f in share.files:
        token = create_download_token(f.id)
        files.append(PublicFile(filename=f.filename, token=token))

    return PublicShareResponse(locked=False, files=files)

@router.get("/file/{token}")
async def download_file(token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        file_id = int(payload.get("sub"))
        token_type = payload.get("type")
        if token_type != "download":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired download link")
        
    result = await db.execute(select(FileRecord).where(FileRecord.id == file_id))
    file_record = result.scalars().first()
    
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_record.file_path, filename=file_record.filename)
