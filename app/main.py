from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

# Configure OpenTelemetry
def configure_opentelemetry():
    # Set up the tracer provider
    trace.set_tracer_provider(TracerProvider())
    tracer_provider = trace.get_tracer_provider()
    
    # Configure Jaeger exporter
    jaeger_endpoint = os.getenv("OTEL_EXPORTER_JAEGER_ENDPOINT", "http://localhost:14268/api/traces")
    jaeger_exporter = JaegerExporter(
        collector_endpoint=jaeger_endpoint,
    )
    
    # Add the span processor to the tracer provider
    span_processor = BatchSpanProcessor(jaeger_exporter)
    tracer_provider.add_span_processor(span_processor)
    
    # Instrument SQLAlchemy for PostgreSQL tracing with more details
    SQLAlchemyInstrumentor().instrument(
        enable_commenter=True,
        enable_metric_attributes=True
    )

from app.db import engine
from app.routers import auth, files, public
from app.models import User, FileRecord, Share
from app.tasks import cleanup_expired_files

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Configure OpenTelemetry at startup
    configure_opentelemetry()
    task = asyncio.create_task(cleanup_expired_files())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

# Middleware to add user info to traces - add BEFORE other middleware
@app.middleware("http")
async def add_user_to_traces(request: Request, call_next):
    tracer = trace.get_tracer(__name__)
    
    # Get current span from FastAPI instrumentation
    current_span = trace.get_current_span()
    if current_span:
        # Get real client IP through Cloudflare proxy
        client_ip = None
        
        # Check Cloudflare headers in order of preference
        cf_connecting_ip = request.headers.get("cf-connecting-ip")
        if cf_connecting_ip:
            client_ip = cf_connecting_ip
        else:
            # Fallback to standard proxy headers
            x_forwarded_for = request.headers.get("x-forwarded-for")
            if x_forwarded_for:
                # X-Forwarded-For can contain multiple IPs, take the first one (original client)
                client_ip = x_forwarded_for.split(",")[0].strip()
            else:
                x_real_ip = request.headers.get("x-real-ip")
                if x_real_ip:
                    client_ip = x_real_ip
                else:
                    # Final fallback to direct connection IP
                    client_ip = request.client.host if request.client else "unknown"
        
        # Add client IP to span
        if client_ip:
            current_span.set_attribute("http.client_ip", client_ip)
            current_span.set_attribute("net.peer.ip", client_ip)
        
        # Add Cloudflare-specific info if available
        cf_ray = request.headers.get("cf-ray")
        if cf_ray:
            current_span.set_attribute("cf.ray", cf_ray)
        
        cf_country = request.headers.get("cf-ipcountry")
        if cf_country:
            current_span.set_attribute("cf.country", cf_country)
        
        # Try to get user from Authorization header
        username = None
        user_id = None
        
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from jose import jwt
                from app.auth import SECRET_KEY, ALGORITHM
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
                
                # Try to get user ID from database if possible
                if username:
                    try:
                        from app.db import get_db
                        from app.models import User
                        from sqlalchemy import select
                        
                        # Create a simple db session for this check
                        async for db in get_db():
                            result = await db.execute(select(User).where(User.username == username))
                            user = result.scalars().first()
                            if user:
                                user_id = str(user.id)
                            break
                    except:
                        pass
            except:
                pass
        
        if username:
            current_span.set_attribute("user.username", username)
            if user_id:
                current_span.set_attribute("user.id", user_id)
    
    response = await call_next(request)
    return response

# Instrument FastAPI with OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

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
