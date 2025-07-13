// netlify/functions/s3-proxy.js
var { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
var { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
var accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.MY_AWS_ACCESS_KEY_ID;
var secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.MY_AWS_SECRET_ACCESS_KEY;
var s3Region = process.env.S3_REGION || process.env.MY_S3_REGION;
var s3Bucket = process.env.S3_BUCKET || process.env.MY_S3_BUCKET;
if (!accessKeyId) {
  throw new Error("Missing AWS access key. Set AWS_ACCESS_KEY_ID (local) or MY_AWS_ACCESS_KEY_ID (Netlify)");
}
if (!secretAccessKey) {
  throw new Error("Missing AWS secret key. Set AWS_SECRET_ACCESS_KEY (local) or MY_AWS_SECRET_ACCESS_KEY (Netlify)");
}
if (!s3Region) {
  throw new Error("Missing S3 region. Set S3_REGION (local) or MY_S3_REGION (Netlify)");
}
if (!s3Bucket) {
  throw new Error("Missing S3 bucket. Set S3_BUCKET (local) or MY_S3_BUCKET (Netlify)");
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
