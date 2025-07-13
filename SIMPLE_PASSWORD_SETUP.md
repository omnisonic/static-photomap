# Simple Password Authentication Setup

This guide will help you set up simple password protection for your GPS Photo Map Viewer.

## 1. Set the Password

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Environment variables**
4. Add a new environment variable:
   - **Key**: `SITE_PASSWORD`
   - **Value**: Your desired password (e.g., `mySecretPassword123`)
5. Click **Save**

## 2. Deploy Your Changes

1. Commit and push your changes to your repository
2. Netlify will automatically deploy the updated site with authentication

## 3. Test the Authentication

1. Visit your site - you should see a password prompt
2. Enter the password you set in step 1
3. Verify that:
   - Wrong passwords show an error message
   - Correct password grants access to the photo map
   - The logout button works correctly
   - Sessions persist when refreshing the page

## 4. Share Access

To give others access to your photo map:
1. Share the site URL with them
2. Provide them with the password you set
3. They can bookmark the site and will stay logged in

## 5. Security Considerations

- **Choose a Strong Password**: Use a password that's hard to guess
- **Change Regularly**: Consider changing the password periodically
- **Monitor Access**: Check your Netlify analytics to see who's accessing your site
- **HTTPS Only**: Ensure your site uses HTTPS (Netlify provides this automatically)

## 6. Managing the Password

### To Change the Password:
1. Go to Netlify dashboard > Site settings > Environment variables
2. Edit the `SITE_PASSWORD` variable
3. Save the changes
4. The new password will be active immediately (no redeploy needed)

### To Temporarily Disable Access:
1. Set `SITE_PASSWORD` to a very complex temporary password
2. This will effectively lock out all users until you restore the original password

## 7. How It Works

- Users enter the password on a login screen
- The password is verified against your `SITE_PASSWORD` environment variable
- A session token is stored in the browser's localStorage
- All S3 requests require this session token
- Sessions persist until the user logs out or clears browser data

## 8. Troubleshooting

### Common Issues:

1. **"Connection error" when logging in**:
   - Check that the `SITE_PASSWORD` environment variable is set
   - Verify the Netlify function is deployed correctly

2. **Password not working**:
   - Double-check the password in your environment variables
   - Ensure there are no extra spaces in the password

3. **Images not loading after login**:
   - Check that your AWS environment variables are still set correctly
   - Verify the S3 proxy function is working in Netlify function logs

4. **Users getting logged out frequently**:
   - This is normal behavior - sessions are stored in browser localStorage
   - Users need to log in again if they clear browser data

## Files Modified for Simple Authentication

- `netlify/functions/simple-auth.js` - Password verification function
- `netlify/functions/s3-proxy.js` - Updated to check session tokens
- `public/js/simple-auth.js` - Simple authentication manager
- `public/index.html` - Added password form
- `public/css/styles.css` - Added authentication styles
- `public/js/main.js` - Updated to use authenticated requests

## Environment Variables Needed

Make sure these are set in your Netlify environment variables:

- `SITE_PASSWORD` - Your chosen password for site access
- `MY_AWS_ACCESS_KEY_ID` - Your AWS access key
- `MY_AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `MY_S3_REGION` - Your S3 bucket region
- `MY_S3_BUCKET` - Your S3 bucket name

Your photo map is now protected with simple password authentication!
