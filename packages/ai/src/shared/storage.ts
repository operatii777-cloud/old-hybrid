import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function getS3Client(): S3Client {
  const endpoint  = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!endpoint)  throw new Error('CLOUDFLARE_R2_ENDPOINT lipsește din .env');
  if (!accessKey) throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID lipsește din .env');
  if (!secretKey) throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY lipsește din .env');
  if (!process.env.CLOUDFLARE_R2_BUCKET) throw new Error('CLOUDFLARE_R2_BUCKET lipsește din .env');
  if (!process.env.CLOUDFLARE_R2_PUBLIC_URL) throw new Error('CLOUDFLARE_R2_PUBLIC_URL lipsește din .env');

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const s3 = getS3Client();
  await s3.send(new PutObjectCommand({
    Bucket:      process.env.CLOUDFLARE_R2_BUCKET!,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}