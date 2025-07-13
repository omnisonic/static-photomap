# Netlify Authentication Setup Guide

This guide will help you set up simple authentication for your GPS Photo Map Viewer using Netlify Identity.

## 1. Enable Netlify Identity

1. Go to your Netlify dashboard
2. Select your site
3. Navigate to **Site settings** > **Identity**
4. Click **Enable Identity**

## 2. Configure Identity Settings

### Registration Settings
1. In the Identity settings, go to **Registration**
2. Choose one of the following options:
   - **Open**: Anyone can sign up (not recommended for private photo collections)
   - **Invite only**: Only people you invite can access (recommended)
   - **Closed**: No new registrations allowed

### External Providers (Optional)
You can enable login with Google, GitHub, etc.:
1. Go to **External providers**
2. Enable the providers you want (Google, GitHub, GitLab, Bitbucket)
3. Configure OAuth settings for each provider

### Email Templates (Optional)
Customize the email templates for:
- Confirmation emails
- Invitation emails
- Recovery emails

## 3. Add Users

### For Invite-Only Registration:
1. Go to **Identity** tab in your site dashboard
2. Click **Invite users**
3. Enter email addresses of people who should have access
4. Click **Send**

### For Open Registration:
Users can sign up directly on your site using the "Sign In" button.

## 4. Test Authentication

1. Deploy your site with the authentication changes
2. Visit your site - you should see the authentication screen
3. Try signing up/logging in
4. Verify that:
   - Unauthenticated users see the login screen
   - Authenticated users can access the photo map
   - The logout button works correctly

## 5. Security Considerations

- **Use Invite-Only**: For private photo collections, use invite-only registration
- **Monitor Users**: Regularly check the Identity tab to see who has access
- **Revoke Access**: You can delete users from the Identity tab to revoke access
- **Environment Variables**: Ensure your AWS credentials are properly secured in Netlify environment variables

## 6. Troubleshooting

### Common Issues:

1. **"Authentication required" errors**:
   - Check that Netlify Identity is enabled
   - Verify the user is properly logged in
   - Check browser console for errors

2. **Users can't sign up**:
   - Verify registration is set to "Open" or "Invite only"
   - Check email spam folders for confirmation emails

3. **S3 images not loading**:
   - Verify AWS environment variables are set correctly
   - Check Netlify function logs for errors
   - Ensure the user is authenticated before making S3 requests

### Checking Function Logs:
1. Go to **Functions** tab in Netlify dashboard
2. Click on a function to see its logs
3. Look for authentication and S3 errors

## 7. Advanced Configuration

### Custom Domains for Identity:
If using a custom domain, you may need to configure Identity settings for your domain.

### Role-Based Access:
Netlify Identity supports user roles and metadata for more advanced access control.

### Webhooks:
You can set up webhooks to trigger actions when users sign up, confirm, or log in.

## Files Modified for Authentication

The following files were added/modified to implement authentication:

- `netlify/functions/auth-check.js` - Authentication check function
- `netlify/functions/s3-proxy.js` - Updated to require authentication
- `public/js/auth.js` - Authentication management
- `public/index.html` - Added auth UI and Netlify Identity widget
- `public/css/styles.css` - Added authentication styles
- `public/js/main.js` - Updated to use authenticated requests

## Next Steps

1. Enable Netlify Identity on your site
2. Configure registration settings
3. Add users (if using invite-only)
4. Test the authentication flow
5. Monitor access and manage users as needed

Your photo map is now protected with simple, secure authentication!
