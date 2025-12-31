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
                result = await db.execute(
                    select(Share)
                    .where(Share.expires_at != None)
                    .where(Share.expires_at < now)
                    .options(selectinload(Share.files))
                )
                expired_shares = result.scalars().unique().all()
                
                if expired_shares:
                    print(f"[{now}] Found {len(expired_shares)} expired shares to clean up.")
                
                for share in expired_shares:
                    print(f"Processing cleanup for share: {share.public_id}")
                    for file_record in share.files:
                        path_to_delete = file_record.file_path
                        if path_to_delete and os.path.exists(path_to_delete):
                            try:
                                os.remove(path_to_delete)
                                print(f"  - Physically deleted file: {path_to_delete}")
                            except Exception as e:
                                print(f"  - FAILED to delete file {path_to_delete}: {e}")
                        else:
                            print(f"  - File already gone or path missing: {path_to_delete}")
                    
                    # Delete the share (cascade deletes file records in DB)
                    await db.delete(share)
                    print(f"  - Deleted share record {share.public_id} from database")
                
                if expired_shares:
                    await db.commit()
                    print(f"[{now}] Cleanup committed successfully.")
                    
        except Exception as e:
            print(f"Error in cleanup task: {e}")
            import traceback
            traceback.print_exc()
        
        await asyncio.sleep(60)
