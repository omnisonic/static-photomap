# GPS Photo Map Viewer (Static Edition)

Combining Leaflet.js mapping with your geo-tagged photos in a lightweight static web app. Deployable via Netlify or AWS S3.

![App Screenshot](https://example.com/path/to/screenshot.jpg)
## Features

- 🗺️ Interactive map with photo markers (Leaflet.js)
- 📸 Photo gallery with EXIF GPS coordinate display
- 📁 Album selection from dropdown
- 📱 Responsive sidebar layout
- 🔒 Optional password protection (Netlify only)
- ⚡ Fast static deployment (no server required)
- 🌐 Multiple deployment options (Netlify + AWS S3)
## Albums Included

- **test**: 1 photo with GPS data
- **july_9_trail_run_unintas**: 33 photos with GPS data

## How to Use

1. Open `index.html` in a web browser
2. Select an album from the dropdown menu
3. View photos on the map by clicking the red camera markers
4. Browse the photo gallery in the main area
5. Click on any photo to view it in full size

## Environment Variables Setup

This project uses different AWS credential variable names for local development versus Netlify deploys to work around Netlify's reserved variable limitations.

### Local Development

Use standard AWS variable names in your shell environment or project `.env` file:

**Option 1: Using .zshenv (recommended for system-wide credentials)**
```bash
# Add to ~/.zshenv
export AWS_ACCESS_KEY_ID=your_aws_access_key_here
export AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
export S3_REGION=us-east-1
export S3_BUCKET=photo-map-private
```

**Option 2: Using project .env file**
```bash
# .env (at project root)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
S3_REGION=us-east-1
S3_BUCKET=photo-map-private
```

### Netlify Deployment

Since Netlify reserves standard AWS variable names, set custom variable names in the Netlify UI:

1. Go to your Netlify site dashboard
2. Navigate to Site settings > Environment variables
3. Add these variables:
   - `MY_AWS_ACCESS_KEY_ID` = your AWS access key
   - `MY_AWS_SECRET_ACCESS_KEY` = your AWS secret key
   - `MY_S3_REGION` = us-east-1
   - `MY_S3_BUCKET` = photo-map-private

The application code automatically detects the environment and uses the appropriate variable names:
- Local: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Netlify: `MY_AWS_ACCESS_KEY_ID`, `MY_AWS_SECRET_ACCESS_KEY`

### Alternative: Using Netlify CLI

You can also set environment variables using the Netlify CLI:

```bash
# Set variables for production
netlify env:set MY_AWS_ACCESS_KEY_ID your_access_key_here
netlify env:set MY_AWS_SECRET_ACCESS_KEY your_secret_key_here

# Set variables for specific deploy contexts
netlify env:set MY_AWS_ACCESS_KEY_ID your_access_key_here --context production
netlify env:set MY_AWS_ACCESS_KEY_ID your_preview_key_here --context deploy-preview
```

## File Structure
