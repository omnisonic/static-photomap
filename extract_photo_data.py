#!/usr/bin/env python3
"""
Extract photo GPS data and create JavaScript data file for static photo map
"""

import os
import json
import glob
from PIL import Image
from PIL.ExifTags import TAGS
import shutil

def convert_to_degrees(value):
    """Convert GPS coordinates to decimal degrees"""
    if not value:
        return None
    
    d, m, s = value
    return d + (m / 60.0) + (s / 3600.0)

def get_gps_coordinates(image_path):
    """Extract GPS coordinates from image EXIF data"""
    try:
        with Image.open(image_path) as image:
            exifdata = image.getexif()
            
            if not exifdata:
                return None, None
            
            # Access GPS data through GPS IFD
            try:
                gps_ifd = exifdata.get_ifd(0x8825)  # GPS IFD tag
                if not gps_ifd:
                    return None, None
                
                # Extract latitude
                lat = None
                lat_ref = gps_ifd.get(1)  # GPSLatitudeRef
                lat_data = gps_ifd.get(2)  # GPSLatitude
                
                if lat_data:
                    lat = convert_to_degrees(lat_data)
                    if lat and lat_ref == 'S':
                        lat = -lat
                
                # Extract longitude
                lon = None
                lon_ref = gps_ifd.get(3)  # GPSLongitudeRef
                lon_data = gps_ifd.get(4)  # GPSLongitude
                
                if lon_data:
                    lon = convert_to_degrees(lon_data)
                    if lon and lon_ref == 'W':
                        lon = -lon
                
                return lat, lon
                
            except Exception as e:
                return None, None
            
    except Exception as e:
        print(f"Error reading GPS data from {image_path}: {str(e)}")
        return None, None

def get_image_datetime(image_path):
    """Extract datetime from image EXIF data"""
    try:
        with Image.open(image_path) as image:
            exifdata = image.getexif()
            
            for tag_id in exifdata:
                tag = TAGS.get(tag_id, tag_id)
                if tag == "DateTime":
                    return exifdata[tag_id]
                    
        return None
    except:
        return None

def scan_photos_directory(photos_dir, album_name):
    """Scan photos directory and extract GPS data"""
    if not os.path.exists(photos_dir):
        return []
    
    photo_data = []
    supported_formats = ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG', '*.png', '*.PNG', '*.tiff', '*.TIFF', '*.webp', '*.WEBP', '*.heic', '*.HEIC']
    
    all_photos = []
    for format in supported_formats:
        all_photos.extend(glob.glob(os.path.join(photos_dir, '**', format), recursive=True))
    
    total_photos = len(all_photos)
    
    if total_photos == 0:
        print(f"No photos found in '{photos_dir}' directory")
        return []
    
    for i, photo_path in enumerate(all_photos):
        print(f"Processing {os.path.basename(photo_path)} ({i+1}/{total_photos})")
        
        lat, lon = get_gps_coordinates(photo_path)
        datetime_taken = get_image_datetime(photo_path)
        
        if lat is not None and lon is not None:
            # Create relative path for web use - include album name in path
            filename = os.path.basename(photo_path)
            photo_data.append({
                'filename': filename,
                'path': f"photos/{album_name}/{filename}",
                'latitude': lat,
                'longitude': lon,
                'datetime': datetime_taken
            })
    
    return photo_data

def extract_photo_data():
    """Extract data from existing photos in the photos directory"""
    photos_dir = "photos"
    
    # Get all album directories
    albums = {}

    if os.path.exists(photos_dir):
        for item in os.listdir(photos_dir):
            item_path = os.path.join(photos_dir, item)
            if os.path.isdir(item_path) and not item.startswith('.'):
                print(f"\nProcessing album: {item}")
                
                # Extract photo data directly from existing photos
                photo_data = scan_photos_directory(item_path, item)
                albums[item] = photo_data
                
                # Check if avenza.geojson exists
                avenza_file = os.path.join(item_path, "avenza.geojson")
                if os.path.exists(avenza_file):
                    print(f"Found avenza.geojson for {item}")
    
    # Create albums directory if it doesn't exist
    albums_dir = "public/js/albums"
    os.makedirs(albums_dir, exist_ok=True)
    
    # Create individual album data files
    for album_name, photo_data in albums.items():
        album_js_content = f"""// Auto-generated photo data for {album_name}
const ALBUM_DATA = {json.dumps(photo_data, indent=2)};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {{
    module.exports = ALBUM_DATA;
}} else {{
    window.ALBUM_DATA = ALBUM_DATA;
}}
"""
        album_file_path = os.path.join(albums_dir, f"{album_name}.js")
        with open(album_file_path, "w") as f:
            f.write(album_js_content)
    
    # Create albums index file
    albums_index_content = f"""// Auto-generated albums index
const AVAILABLE_ALBUMS = {json.dumps(list(albums.keys()), indent=2)};

// Get list of available albums
function getAvailableAlbums() {{
    return AVAILABLE_ALBUMS;
}}

// Load album data dynamically
async function loadAlbumData(albumName) {{
    try {{
        const response = await fetch(`js/albums/${{albumName}}.js`);
        if (!response.ok) {{
            throw new Error(`Failed to load album data: ${{response.status}}`);
        }}
        
        // Create a script element to load the album data
        return new Promise((resolve, reject) => {{
            const script = document.createElement('script');
            script.src = `js/albums/${{albumName}}.js`;
            script.onload = () => {{
                const albumData = window.ALBUM_DATA;
                resolve(albumData || []);
            }};
            script.onerror = () => reject(new Error(`Failed to load album script`));
            document.head.appendChild(script);
        }});
    }} catch (error) {{
        console.error(`Error loading album data for ${{albumName}}:`, error);
        return [];
    }}
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
    
    with open("public/js/albums.js", "w") as f:
        f.write(albums_index_content)
    
    print(f"\nExtracted data for {len(albums)} albums")
    for album, photos in albums.items():
        print(f"  {album}: {len(photos)} photos with GPS data")

if __name__ == "__main__":
    extract_photo_data()
    print("\nPhoto data extraction complete!")
