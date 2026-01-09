from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from opentelemetry import trace

from app.db import get_db
from app.models import User
from app.schemas import UserResponse, Token, ChangePassword
from app.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    tracer = trace.get_tracer(__name__)
    
    with tracer.start_as_current_span("auth.login") as span:
        span.set_attribute("auth.username", form_data.username)
        span.set_attribute("auth.operation", "login")
        
        with tracer.start_as_current_span("database.user_lookup") as db_span:
            db_span.set_attribute("db.operation", "select")
            db_span.set_attribute("db.table", "users")
            db_span.set_attribute("db.query.filter", f"username = {form_data.username}")
            
            result = await db.execute(select(User).where(User.username == form_data.username))
            user = result.scalars().first()
            
            db_span.set_attribute("db.result.count", 1 if user else 0)
            db_span.set_attribute("db.user_found", user is not None)
        
        if not user or not verify_password(form_data.password, user.hashed_password):
            span.set_attribute("auth.success", False)
            span.set_attribute("auth.error", "invalid_credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        span.set_attribute("auth.success", True)
        span.set_attribute("auth.user_id", str(user.id))
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {
        "access_token": access_token, 
        "token_type": "bearer",
        "must_change_password": user.must_change_password
    }

@router.post("/change-password")
async def change_password(
    data: ChangePassword, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.must_change_password = False
    db.add(current_user)
    await db.commit()
    return {"message": "Password changed successfully"}
