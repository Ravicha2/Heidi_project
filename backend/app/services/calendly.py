import os
import urllib.parse

class CalendlyService:
    def __init__(self):
        self.path_inperson = os.getenv("CALENDLY_PATH_INPERSON")
        self.path_telehealth = os.getenv("CALENDLY_PATH_TELEHEALTH")
        # Default to telehealth if not specified, or fallback
        self.default_path = self.path_telehealth or self.path_inperson

    def create_event_link(self, name: str, email: str, mode: str = None) -> str:
        """
        Generates a pre-filled Calendly booking link.
        """
        base_url = self.default_path
        
        if mode:
            if "clinic" in mode.lower() or "person" in mode.lower():
                base_url = self.path_inperson or base_url
            elif "telehealth" in mode.lower() or "video" in mode.lower():
                base_url = self.path_telehealth or base_url

        if not base_url:
            return None

        params = {
            "name": name,
            "email": email
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{base_url}?{query_string}"

    def get_base_url(self, mode: str = None) -> str:
        """
        Returns the base scheduling URL for the given mode.
        """
        if mode:
            if "clinic" in mode.lower() or "person" in mode.lower():
                return self.path_inperson or self.default_path
            elif "telehealth" in mode.lower() or "video" in mode.lower():
                return self.path_telehealth or self.default_path
        return self.default_path

calendly_service = CalendlyService()
