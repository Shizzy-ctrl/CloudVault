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
    must_change_password: bool

    class Config:
        from_attributes = True

class ChangePassword(BaseModel):
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    must_change_password: bool

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
    created_at: Optional[datetime] = None
    is_shared: Optional[bool] = None

class ShareListItem(BaseModel):
    public_id: str
    share_link: str
    file_count: int
    expires_at: Optional[datetime]
    password_protected: bool
    created_at: Optional[datetime]
    is_shared: bool

class ShareUpdate(BaseModel):
    password: Optional[str] = None
    expires_minutes: Optional[int] = None
