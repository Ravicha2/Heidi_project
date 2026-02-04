from typing import List, Optional
from datetime import datetime
from app.models.voicemail import VoicemailMetadata

class Database:
    def __init__(self):
        # In-memory store
        self.data: List[dict] = []

    def save_voicemail(self, vm: dict):
        self.data.append(vm)

    def get_voicemail(self, vm_id: str) -> Optional[dict]:
        for vm in self.data:
            if vm["id"] == vm_id:
                return vm
        return None

    def update_voicemail(self, vm_id: str, updates: dict):
        vm = self.get_voicemail(vm_id)
        if vm:
            vm.update(updates)
            
    def list_voicemails(self) -> List[dict]:
        return self.data

# Global instance
db = Database()
