#!/bin/bash
# upload-photos-to-s3.sh - Private bucket version

# Configure these variables
S3_BUCKET="photo-map-private"
S3_REGION="us-east-1"
LOCAL_PHOTOS_DIR="photos"
MAX_CONCURRENT_UPLOADS=10
ACL="private"  # Changed to private

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "AWS CLI not found. Install it first: https://aws.amazon.com/cli/"
    exit 1
fi

# Create private S3 bucket if it doesn't exist
echo "Checking S3 bucket..."
if ! aws s3api head-bucket --bucket "$S3_BUCKET" --region "$S3_REGION" 2>/dev/null; then
    echo "Creating private bucket $S3_BUCKET..."
    aws s3 mb "s3://$S3_BUCKET" --region "$S3_REGION"
    
    # Remove public access block (enabled by default in new buckets)
    aws s3api put-public-access-block \
        --bucket "$S3_BUCKET" \
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    echo "Bucket created with all public access blocked"
fi

# Verify Python processing completed
if [ ! -f "./js/photo-data.js" ]; then
    echo "Error: photo-data.js not found. Run extract_photo_data.py first."
    exit 1
fi

# Upload function for private bucket
upload_file() {
    local file=$1
    local s3_key="photos/${file#$LOCAL_PHOTOS_DIR/}"
    
    aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key" \
        --region "$S3_REGION" \
        --acl "$ACL" \
        --cache-control "max-age=31536000" \
        --content-type "$(file --mime-type -b "$file")" \
        --metadata-directive REPLACE
}

# Export function for parallel processing
export -f upload_file
export S3_BUCKET S3_REGION ACL LOCAL_PHOTOS_DIR

echo "=== Uploading photos to private S3 bucket ==="
echo "Bucket: $S3_BUCKET (private)"
echo "Region: $S3_REGION"
echo "Source: $LOCAL_PHOTOS_DIR"
echo

# Upload files to private bucket - modified version with parallel check
if command -v parallel &> /dev/null; then
    # Use parallel if available (faster)
    find "$LOCAL_PHOTOS_DIR" -type f -print0 | parallel -0 aws s3 cp {} s3://"$S3_BUCKET"/{} --region "$AWS_REGION"
else
    echo "GNU Parallel not found - using slower sequential upload"
    # Fallback to sequential upload
    find "$LOCAL_PHOTOS_DIR" -type f -exec aws s3 cp {} s3://"$S3_BUCKET"/{} --region "$AWS_REGION" \;
fi

echo "=== Upload to private bucket complete ==="
echo
echo "Note: Bucket is private - you'll need to:"
echo "1. Configure access via IAM policies or temporary URLs"
echo "2. Update your application to use proper authentication"
echo "3. Remove .bak file if not needed: rm ./js/photo-data.js.bak"