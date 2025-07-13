# Environment Variables Setup Guide

This guide explains how to configure AWS credentials for different deployment environments.

## Problem

Netlify reserves standard AWS environment variable names (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) and doesn't allow you to set or override them in their environment. This creates a conflict when you want to use your own AWS credentials for S3 access.

## Solution

Use different variable names for local development versus Netlify deploys, with fallback logic in the application code.

## Local Development Setup

You can set AWS credentials using either a project-level `.env` file or your shell environment (like `.zshenv`).

### Option 1: Using .zshenv (Recommended for system-wide credentials)

Add to your `~/.zshenv` file:

```bash
# AWS credentials in ~/.zshenv
export AWS_ACCESS_KEY_ID=your_aws_access_key_here
export AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
export S3_REGION=us-east-1
export S3_BUCKET=photo-map-private
```

After updating `.zshenv`, reload your shell:
```bash
source ~/.zshenv
# or start a new terminal session
```

### Option 2: Using project .env file

Create or update your `.env` file in the project root:

```bash
# .env (at project root)
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
S3_REGION=us-east-1
S3_BUCKET=photo-map-private
```

The Netlify CLI will read variables from both your shell environment and project `.env` file during local development.

## Netlify Production Setup

### Option 1: Netlify UI

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add these variables:
   - `MY_AWS_ACCESS_KEY_ID` = your AWS access key
   - `MY_AWS_SECRET_ACCESS_KEY` = your AWS secret key
   - `S3_REGION` = us-east-1
   - `S3_BUCKET` = photo-map-private

### Option 2: Netlify CLI

```bash
# Set variables for all contexts
netlify env:set MY_AWS_ACCESS_KEY_ID your_access_key_here
netlify env:set MY_AWS_SECRET_ACCESS_KEY your_secret_key_here
netlify env:set S3_REGION us-east-1
netlify env:set S3_BUCKET photo-map-private

# Or set for specific deploy contexts
netlify env:set MY_AWS_ACCESS_KEY_ID your_prod_key --context production
netlify env:set MY_AWS_ACCESS_KEY_ID your_preview_key --context deploy-preview
netlify env:set MY_AWS_ACCESS_KEY_ID your_branch_key --context branch-deploy
```

### Option 3: netlify.toml (Not Recommended for Secrets)

```toml
[context.production.environment]
  S3_REGION = "us-east-1"
  S3_BUCKET = "photo-map-private"
  # Don't put secrets in netlify.toml as it's committed to git
```

## How It Works

The application code in `netlify/functions/s3-proxy.js` uses fallback logic:

```javascript
// Local development: use standard AWS variable names
// Netlify deploys: use custom variable names
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY;
```

This means:
- **Locally**: Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from your `.env` file
- **On Netlify**: Uses `MY_AWS_ACCESS_KEY_ID` and `MY_AWS_SECRET_ACCESS_KEY` from Netlify's environment

## Verification

### Local Development
```bash
netlify dev
# Check that your function can access S3 using local credentials
```

### Netlify Deploy
```bash
netlify deploy --prod
# Check function logs in Netlify dashboard to verify credentials are working
```

## Troubleshooting

### Error: "Missing AWS access key"
- **Local**: Check that `AWS_ACCESS_KEY_ID` is set in your `.env` file
- **Netlify**: Check that `MY_AWS_ACCESS_KEY_ID` is set in Netlify environment variables

### Error: "Missing AWS secret key"
- **Local**: Check that `AWS_SECRET_ACCESS_KEY` is set in your `.env` file
- **Netlify**: Check that `MY_AWS_SECRET_ACCESS_KEY` is set in Netlify environment variables

### Function works locally but fails on Netlify
- Verify that you've set the `MY_AWS_*` variables in Netlify (not the standard `AWS_*` ones)
- Check the function logs in the Netlify dashboard for specific error messages

## Security Notes

- Never commit AWS credentials to git
- Use IAM roles with minimal required permissions
- Consider using different AWS credentials for different deploy contexts (production vs preview)
- Regularly rotate your AWS access keys
