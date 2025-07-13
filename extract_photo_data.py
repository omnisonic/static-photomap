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

def scan_photos_directory(photos_dir):
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
            # Create relative path for web use
            rel_path = os.path.relpath(photo_path, photos_dir)
            photo_data.append({
                'filename': os.path.basename(photo_path),
                'path': f"photos/{rel_path}",
                'latitude': lat,
                'longitude': lon,
                'datetime': datetime_taken
            })
    
    return photo_data

def copy_photos_and_extract_data():
    """Copy photos and extract data for all albums"""
    source_photos_dir = "../photos"
    target_photos_dir = "photos"
    
    # Get all album directories
    albums = {}
    S3_BASE_URL = "s3://photo-map-private/photos"  # Added S3 base URL
    
    if os.path.exists(source_photos_dir):
        for item in os.listdir(source_photos_dir):
            item_path = os.path.join(source_photos_dir, item)
            if os.path.isdir(item_path) and not item.startswith('.'):
                print(f"\nProcessing album: {item}")
                
                # Copy photos
                target_album_dir = os.path.join(target_photos_dir, item)
                if os.path.exists(target_album_dir):
                    shutil.rmtree(target_album_dir)
                shutil.copytree(item_path, target_album_dir)
                
                # Extract photo data with S3 paths
                photo_data = scan_photos_directory(target_album_dir)
                # Update paths to use S3 URLs
                for photo in photo_data:
                    photo['path'] = os.path.join(S3_BASE_URL, item, os.path.basename(photo['path']))
                albums[item] = photo_data
                
                # Copy avenza.geojson if it exists
                avenza_source = os.path.join(item_path, "avenza.geojson")
                if os.path.exists(avenza_source):
                    avenza_target = os.path.join(target_album_dir, "avenza.geojson")
                    shutil.copy2(avenza_source, avenza_target)
                    print(f"Copied avenza.geojson for {item}")
    
    # Create JavaScript data file - update fetch URL to use S3 path
    js_content = f"""// Auto-generated photo data
const PHOTO_DATA = {json.dumps(albums, indent=2)};

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
        const response = await fetch(`{S3_BASE_URL}/${{albumName}}/avenza.geojson`);
        if (response.ok) {{
            return await response.json();
        }}
    }} catch (error) {{
        console.log(`No Avenza data found for ${{albumName}}`);
    }}
    return null;
}}
"""
    
    with open("js/photo-data.js", "w") as f:
        f.write(js_content)
    
    print(f"\nExtracted data for {len(albums)} albums")
    for album, photos in albums.items():
        print(f"  {album}: {len(photos)} photos with GPS data")

if __name__ == "__main__":
    copy_photos_and_extract_data()
    print("\nPhoto data extraction complete!")
