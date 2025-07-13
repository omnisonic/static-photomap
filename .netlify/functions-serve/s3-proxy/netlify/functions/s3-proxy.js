// netlify/functions/s3-proxy.js
var { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
var { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
var accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY;
if (!accessKeyId) {
  throw new Error("Missing AWS access key. Set AWS_ACCESS_KEY_ID (local) or MY_AWS_ACCESS_KEY_ID (Netlify)");
}
if (!secretAccessKey) {
  throw new Error("Missing AWS secret key. Set AWS_SECRET_ACCESS_KEY (local) or MY_AWS_SECRET_ACCESS_KEY (Netlify)");
}
if (!process.env.S3_REGION) {
  throw new Error("Missing required env var: S3_REGION");
}
if (!process.env.S3_BUCKET) {
  throw new Error("Missing required env var: S3_BUCKET");
}
exports.handler = async (event) => {
  try {
    const { key } = event.queryStringParameters;
    const s3 = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 900 });
    return {
      statusCode: 200,
      body: url,
      headers: { "Cache-Control": "public, max-age=300" }
    };
  } catch (err) {
    console.error("S3 Error:", {
      message: err.message,
      stack: err.stack,
      queryParams: event.queryStringParameters
    });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        details: "Check function logs"
      })
    };
  }
};
//# sourceMappingURL=s3-proxy.js.map
