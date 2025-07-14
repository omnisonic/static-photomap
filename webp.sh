#!/bin/bash

# Usage function
usage() {
  echo "Usage: $0 [target_directory]"
  echo "  target_directory: Directory containing images to convert (default: photos)"
  echo "Example: $0 ../my-photos"
  echo "         $0 /path/to/images"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  usage
  exit 0
fi

# Set the target directory from argument or use default
if [ $# -eq 0 ]; then
  target_dir="photos"  # Default fallback
  echo "No target directory specified, using default: $target_dir"
else
  target_dir="$1"
  echo "Using target directory: $target_dir"
fi

# Check if the target directory exists
if [ ! -d "$target_dir" ]; then
  echo "Error: Target directory '$target_dir' not found."
  echo ""
  usage
  exit 1
fi

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null
then
    echo "Error: cwebp command is not installed. Please install the WebP tools."
    exit 1
fi

# Check if ImageMagick magick is installed (needed for orientation correction)
if ! command -v magick &> /dev/null
then
    echo "Error: ImageMagick magick command is not installed. Please install ImageMagick."
    exit 1
fi

find "$target_dir" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0 | while IFS= read -r -d $'\0' file; do
  # Determine the output filename
  filename=$(basename "$file")
  extension="${filename##*.}"
  filename_without_extension="${filename%.*}"
  output_file="${filename_without_extension}.webp"
  output_path=$(dirname "$file")
  full_output_path="${output_path}/${output_file}"

  # Check if the webp file already exists
  if [ -f "$full_output_path" ]; then
    echo "WebP file already exists: $full_output_path"
    continue # Skip to the next file
  fi

  echo "Converting: $file to $full_output_path"

  # Create a temporary file for the oriented image
  temp_file="${output_path}/.temp_${filename_without_extension}_oriented.${extension}"

  # First, use ImageMagick to auto-orient the image and resize it
  magick "$file" -auto-orient -resize 1280x "$temp_file"

  if [ $? -eq 0 ]; then
    # Then convert the oriented image to webp
    cwebp -metadata all "$temp_file" -o "$full_output_path"

    if [ $? -eq 0 ]; then
      echo "Successfully converted $file to $full_output_path"

      # Remove the original JPEG file after successful conversion
      if [[ "$extension" =~ ^(jpg|jpeg|JPG|JPEG)$ ]]; then
        rm "$file"
        echo "Original JPEG file removed: $file"
      else
        echo "Original file preserved: $file (not a JPEG)"
      fi
    else
      echo "Failed to convert $file to WebP"
    fi

    # Clean up the temporary file
    rm "$temp_file"
  else
    echo "Failed to orient and resize $file"
  fi
done

echo "Conversion process completed."
