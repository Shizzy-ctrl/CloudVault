from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin, ModelView
from sqlalchemy.ext.asyncio import create_async_engine

from app.db import engine
from app.routers import auth, files, public
from app.models import User, FileRecord, Share
from app.tasks import cleanup_expired_files

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_expired_files())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(public.router)

class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username, User.is_active]

class ShareAdmin(ModelView, model=Share):
    column_list = [Share.id, Share.public_id, Share.created_at, Share.expires_at]

class FileAdmin(ModelView, model=FileRecord):
    column_list = [FileRecord.id, FileRecord.filename, FileRecord.share_id]

admin = Admin(app, engine)
admin.add_view(UserAdmin)
admin.add_view(ShareAdmin)
admin.add_view(FileAdmin)

@app.get("/")
async def root():
    return {"message": "Welcome to File Sharing API."}
