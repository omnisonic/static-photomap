# Environment Variables Setup Checklist

## ✅ Completed Changes

- [x] Updated `.env` file with standard AWS variable names for local development
- [x] Modified `netlify/functions/s3-proxy.js` to use fallback logic for environment variables
- [x] Updated `README.md` with environment variable documentation
- [x] Created `ENVIRONMENT_SETUP.md` with detailed setup guide

## 🔧 Manual Steps Required

### For Local Development
1. **Set your AWS credentials** using either method:
   
   **Option A: Using .zshenv (recommended for system-wide credentials)**
   ```bash
   # Add to ~/.zshenv
   export AWS_ACCESS_KEY_ID=your_actual_aws_access_key_here
   export AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_key_here
   export S3_REGION=us-east-1
   export S3_BUCKET=photo-map-private
   
   # Then reload your shell
   source ~/.zshenv
   ```
   
   **Option B: Using project .env file**
   ```bash
   # Replace placeholder values in .env
   AWS_ACCESS_KEY_ID=your_actual_aws_access_key_here
   AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_key_here
   ```

### For Netlify Deployment
2. **Set custom environment variables in Netlify**:
   
   **Option A: Using Netlify UI**
   - Go to your Netlify site dashboard
   - Navigate to Site settings > Environment variables
   - Add:
     - `MY_AWS_ACCESS_KEY_ID` = your AWS access key
     - `MY_AWS_SECRET_ACCESS_KEY` = your AWS secret key
     - `MY_S3_REGION` = us-east-1
     - `MY_S3_BUCKET` = photo-map-private

   **Option B: Using Netlify CLI**
   ```bash
   netlify env:set MY_AWS_ACCESS_KEY_ID your_access_key_here
   netlify env:set MY_AWS_SECRET_ACCESS_KEY your_secret_key_here
   netlify env:set MY_S3_REGION us-east-1
   netlify env:set MY_S3_BUCKET photo-map-private
   ```

## 🧪 Testing

### Test Local Development
```bash
# Start local development server
netlify dev

# Test the S3 proxy function
# Visit your local site and verify photos load correctly
```

### Test Netlify Deployment
```bash
# Deploy to Netlify
netlify deploy --prod

# Check function logs in Netlify dashboard
# Verify photos load correctly on the deployed site
```

## 🔍 Verification

The application will now:
- **Locally**: Use `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from `.env`
- **On Netlify**: Use `MY_AWS_ACCESS_KEY_ID` and `MY_AWS_SECRET_ACCESS_KEY` from Netlify environment

If you see errors like "Missing AWS access key", check that you've set the correct variables for your environment (see troubleshooting in `ENVIRONMENT_SETUP.md`).
