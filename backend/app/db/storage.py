from typing import List, Optional
from app.models.voicemail import Voicemail
from app.db.session import SessionLocal

class Database:
    def __init__(self):
        pass

    def get_session(self):
        return SessionLocal()

    def save_voicemail(self, vm_data: dict):
        db = self.get_session()
        try:
            # Create SQLAlchemy model instance
            # We assume vm_data keys match Voicemail columns
            # JSON field 'analysis' needs to be handled if passed as dict
            db_vm = Voicemail(**vm_data)
            db.add(db_vm)
            db.commit()
            db.refresh(db_vm)
            return db_vm
        finally:
            db.close()

    def get_voicemail(self, vm_id: str) -> Optional[Voicemail]:
        db = self.get_session()
        try:
            return db.query(Voicemail).filter(Voicemail.id == vm_id).first()
        finally:
            db.close()

    def update_voicemail(self, vm_id: str, updates: dict):
        db = self.get_session()
        try:
            db_vm = db.query(Voicemail).filter(Voicemail.id == vm_id).first()
            if db_vm:
                for key, value in updates.items():
                    setattr(db_vm, key, value)
                db.commit()
                db.refresh(db_vm)
            return db_vm
        finally:
            db.close()
            
    def list_voicemails(self) -> List[Voicemail]:
        db = self.get_session()
        try:
            return db.query(Voicemail).all()
        finally:
            db.close()

# Global instance
db = Database()
