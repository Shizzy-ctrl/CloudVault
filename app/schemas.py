from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_superuser: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FileResponse(BaseModel):
    id: int
    filename: str

class ShareResponse(BaseModel):
    public_id: str
    share_link: str
    files: List[FileResponse]
    expires_at: Optional[datetime]
    password_protected: bool

class ShareUpdate(BaseModel):
    password: Optional[str] = None
    expires_minutes: Optional[int] = None
