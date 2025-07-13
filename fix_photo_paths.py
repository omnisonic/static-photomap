#!/usr/bin/env python3
"""
Fix photo paths in photo-data.js
"""

import json
import re

# Read the current photo-data.js file
with open('js/photo-data.js', 'r') as f:
    content = f.read()

# Extract the JSON data
json_match = re.search(r'const PHOTO_DATA = ({.*?});', content, re.DOTALL)
if json_match:
    json_str = json_match.group(1)
    photo_data = json.loads(json_str)
    
    # Fix paths for july_9_trail_run_unintas album
    if 'july_9_trail_run_unintas' in photo_data:
        for photo in photo_data['july_9_trail_run_unintas']:
            if not photo['path'].startswith('photos/july_9_trail_run_unintas/'):
                filename = photo['filename']
                photo['path'] = f'photos/july_9_trail_run_unintas/{filename}'
    
    # Recreate the JavaScript file
    js_content = f"""// Auto-generated photo data
const PHOTO_DATA = {json.dumps(photo_data, indent=2)};

// Get list of available albums
function getAvailableAlbums() {{
    return Object.keys(PHOTO_DATA);
}}

// Get photos for a specific album
function getPhotosForAlbum(albumName) {{
    return PHOTO_DATA[albumName] || [];
}}

// Load Avenza data for an album if available
async function loadAvenzaData(albumName) {{
    try {{
        const response = await fetch(`photos/${{albumName}}/avenza.geojson`);
        if (response.ok) {{
            return await response.json();
        }}
    }} catch (error) {{
        console.log(`No Avenza data found for ${{albumName}}`);
    }}
    return null;
}}
"""
    
    with open('js/photo-data.js', 'w') as f:
        f.write(js_content)
    
    print("Fixed photo paths in photo-data.js")
else:
    print("Could not find PHOTO_DATA in the file")
