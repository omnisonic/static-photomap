#!/bin/bash
# upload-photos-to-s3.sh - Private bucket version with directory-based buckets

# Source .env file if it exists to load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Configure these variables (use environment variables if set, otherwise defaults)
S3_BUCKET="${S3_BUCKET:-photo-map-private}"
S3_REGION="${S3_REGION:-your-aws-region}"
LOCAL_PHOTOS_DIR="${LOCAL_PHOTOS_DIR:-photos}"
MAX_CONCURRENT_UPLOADS="${MAX_CONCURRENT_UPLOADS:-10}"
ACL="${ACL:-private}"  # Changed to private

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Install it first: https://aws.amazon.com/cli/"
    exit 1
fi

# Function to create private S3 bucket if it doesn't exist
create_bucket_if_needed() {
    local bucket_name=$1
    echo "Checking S3 bucket: $bucket_name..."
    if ! aws s3api head-bucket --bucket "$bucket_name" --region "$S3_REGION" 2>/dev/null; then
        echo "Creating private bucket $bucket_name..."
        aws s3 mb "s3://$bucket_name" --region "$S3_REGION"
        
        # Remove public access block (enabled by default in new buckets)
        aws s3api put-public-access-block \
            --bucket "$bucket_name" \
            --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
        
        echo "Bucket $bucket_name created with all public access blocked"
    else
        echo "Bucket $bucket_name already exists"
    fi
}

# Verify Python processing completed
if [ ! -f "./public/js/photo-data.js" ]; then
    echo "Error: photo-data.js not found. Run extract_photo_data.py first."
    exit 1
fi

# Debug: Show what variables are being used
echo "=== Uploading photos to private S3 bucket ==="
echo "Region: $S3_REGION"
echo "Source: $LOCAL_PHOTOS_DIR"
echo "Bucket: $S3_BUCKET"
echo "ACL: $ACL"
echo

# Check if S3_REGION is still default
if [ "$S3_REGION" = "your-aws-region" ]; then
    echo "WARNING: S3_REGION is still set to default value 'your-aws-region'"
    echo "Please set S3_REGION environment variable or update .env file"
    exit 1
fi

# Create the main bucket if needed
create_bucket_if_needed "$S3_BUCKET"

# Process each directory in photos folder
for photo_dir in "$LOCAL_PHOTOS_DIR"/*; do
    # Skip if not a directory or if it's a hidden file
    if [ ! -d "$photo_dir" ] || [[ "$(basename "$photo_dir")" == .* ]]; then
        continue
    fi
    
    # Get directory name for S3 folder structure
    dir_name=$(basename "$photo_dir")
    
    echo "Processing directory: $dir_name"
    echo "Target: s3://$S3_BUCKET/photos/$dir_name/"
    
    # Upload files from this directory to the folder in S3
    echo "Uploading files from $photo_dir to s3://$S3_BUCKET/photos/$dir_name/..."
    
    # Count total files and track progress
    total_files=$(find "$photo_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l)
    uploaded_count=0
    skipped_count=0
    
    echo "Found $total_files files to process..."
    
    # Process files one by one to check if they exist
    find "$photo_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r file; do
        filename=$(basename "$file")
        s3_path="s3://$S3_BUCKET/photos/$dir_name/$filename"
        
        # Check if file already exists in S3
        if aws s3 ls "$s3_path" --region "$S3_REGION" >/dev/null 2>&1; then
            echo "Skipping $filename (already exists)"
            ((skipped_count++))
        else
            echo "Uploading $filename..."
            aws s3 cp "$file" "$s3_path" \
                --region "$S3_REGION" \
                --acl "$ACL" \
                --cache-control "max-age=31536000" \
                --content-type "$(file --mime-type -b "$file")" \
                --metadata-directive REPLACE
            
            if [ $? -eq 0 ]; then
                ((uploaded_count++))
                echo "✓ Uploaded $filename"
            else
                echo "✗ Failed to upload $filename"
            fi
        fi
    done
    
    echo "Upload summary for $dir_name: $uploaded_count uploaded, $skipped_count skipped"
    
    echo "Completed upload for $dir_name"
    echo
done

echo "=== Upload to private bucket complete ==="
echo
echo "Note: Bucket is private - you'll need to:"
echo "1. Configure access via IAM policies or temporary URLs"
echo "2. Update your application to use proper authentication"
echo "3. Remove .bak file if not needed: rm ./js/photo-data.js.bak"
