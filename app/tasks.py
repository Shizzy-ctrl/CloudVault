import asyncio
import os
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import AsyncSessionLocal
from app.models import Share

async def cleanup_expired_files():
    while True:
        try:
            async with AsyncSessionLocal() as db:
                now = datetime.utcnow()
                # Eager load files to delete them
                result = await db.execute(select(Share).where(Share.expires_at < now).options(selectinload(Share.files)))
                expired_shares = result.scalars().all()
                
                for share in expired_shares:
                    print(f"Deleting expired share: {share.public_id}")
                    for file_record in share.files:
                        if file_record.file_path and os.path.exists(file_record.file_path):
                            try:
                                os.remove(file_record.file_path)
                                print(f"Deleted file: {file_record.file_path}")
                            except OSError as e:
                                print(f"Error deleting file {file_record.file_path}: {e}")
                    
                    # Delete the share (cascade deletes file records in DB)
                    await db.delete(share)
                
                if expired_shares:
                    await db.commit()
                    
        except Exception as e:
            print(f"Error in cleanup task: {e}")
        
        await asyncio.sleep(60)
