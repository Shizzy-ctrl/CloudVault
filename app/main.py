from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

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

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "secret-key-for-session"))

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(public.router)

from starlette_admin.contrib.sqla import Admin, ModelView
from starlette_admin import action
import secrets
from app.auth import get_password_hash
from starlette.responses import Response
from starlette.requests import Request
from starlette_admin.exceptions import FormValidationError
from sqlalchemy.exc import IntegrityError

class UserAdmin(ModelView):
    identity = "user"
    label = "Users"
    icon = "fa fa-users"
    column_list = ["id", "username", "is_active", "is_superuser", "must_change_password"]
    exclude_fields_from_create = ["hashed_password", "must_change_password", "shares"]
    exclude_fields_from_edit = ["hashed_password", "must_change_password", "shares"]
    
    async def before_create(self, request: Request, data: dict, obj: User) -> None:
        otp = str(secrets.randbelow(900000) + 100000)
        obj.hashed_password = get_password_hash(otp)
        obj.must_change_password = True
        request.state.otp = otp

    async def after_create(self, request: Request, obj: User) -> None:
        otp = getattr(request.state, "otp", "Unknown")
        # Set successAlert in session, which will be picked up by our base.html override
        request.session["successAlert"] = f"User created successfully! Initial OTP: {otp}"

    def handle_exception(self, exc: Exception) -> None:
        if isinstance(exc, IntegrityError):
            if "ix_users_username" in str(exc):
                raise FormValidationError({"username": "Username already exists"})
        raise exc

    @action(
        name="reset_password",
        text="Reset Password",
        confirmation="Are you sure you want to reset this user's password?",
        submit_btn_text="Yes, reset",
    )
    async def reset_password_action(self, request: Request, pks: list) -> str:
        db = request.state.session
        messages = []
        for pk in pks:
            user = await self.find_by_pk(request, pk)
            otp = str(secrets.randbelow(900000) + 100000)
            user.hashed_password = get_password_hash(otp)
            user.must_change_password = True
            db.add(user)
            messages.append(f"Password reset for {user.username}. New OTP: {otp}")
        await db.commit()
        return " | ".join(messages)

class ShareAdmin(ModelView):
    identity = "share"
    label = "Shares"
    icon = "fa fa-share-alt"
    column_list = ["id", "public_id", "owner", "created_at", "expires_at", "is_shared", "files"]

class FileAdmin(ModelView):
    identity = "file-record"
    label = "Files"
    icon = "fa fa-file"
    column_list = ["id", "filename", "share_id"]

admin = Admin(engine, title="File Sharing Admin", templates_dir="app/templates_admin")
admin.add_view(UserAdmin(User))
admin.add_view(ShareAdmin(Share))
admin.add_view(FileAdmin(FileRecord))

admin.mount_to(app)

@app.get("/")
async def root():
    return {"message": "Welcome to File Sharing API."}
