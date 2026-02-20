import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket:      process.env.CLOUDFLARE_R2_BUCKET!,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
