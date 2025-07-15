#!/usr/bin/env python3
import base64
import os

# The logo image data would be inserted here
# This is a placeholder - actual image data would need to be extracted from the message
logo_data = """
/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAC0ALQDA
"""

def save_logo():
    try:
        # Clean the data
        logo_data_clean = logo_data.strip().replace('\n', '')
        
        # Decode base64
        image_data = base64.b64decode(logo_data_clean)
        
        # Save to file
        with open('/app/frontend/public/images/bookcraft-logo.png', 'wb') as f:
            f.write(image_data)
        
        print("Logo saved successfully!")
        return True
    except Exception as e:
        print(f"Error saving logo: {e}")
        return False

if __name__ == "__main__":
    save_logo()