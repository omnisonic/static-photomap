const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Get AWS credentials and S3 config - use only custom variable names for Netlify
// This avoids Netlify's reserved AWS environment variables entirely
const accessKeyId = process.env.MY_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.MY_AWS_SECRET_ACCESS_KEY;
const s3Region = process.env.MY_S3_REGION;
const s3Bucket = process.env.MY_S3_BUCKET;

// Debug logging (will appear in Netlify function logs)
console.log('Environment check:', {
  hasMyAccessKey: !!process.env.MY_AWS_ACCESS_KEY_ID,
  hasMySecretKey: !!process.env.MY_AWS_SECRET_ACCESS_KEY,
  hasMyRegion: !!process.env.MY_S3_REGION,
  hasMyBucket: !!process.env.MY_S3_BUCKET,
  accessKeyPrefix: accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'undefined'
});

// Validate environment variables
if (!accessKeyId) {
  throw new Error('Missing MY_AWS_ACCESS_KEY_ID environment variable. Set this in Netlify dashboard.');
}
if (!secretAccessKey) {
  throw new Error('Missing MY_AWS_SECRET_ACCESS_KEY environment variable. Set this in Netlify dashboard.');
}
if (!s3Region) {
  throw new Error('Missing MY_S3_REGION environment variable. Set this in Netlify dashboard.');
}
if (!s3Bucket) {
  throw new Error('Missing MY_S3_BUCKET environment variable. Set this in Netlify dashboard.');
}

exports.handler = async (event) => {
  try {
    const { key } = event.queryStringParameters;

    const s3 = new S3Client({
      region: s3Region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 900 });
    return {
      statusCode: 200,
      body: url,
      headers: { 'Cache-Control': 'public, max-age=300' }
    };
  } catch (err) {
    console.error('S3 Error:', {
      message: err.message,
      stack: err.stack,
      queryParams: event.queryStringParameters
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        details: 'Check function logs'
      })
    };
  }
};
