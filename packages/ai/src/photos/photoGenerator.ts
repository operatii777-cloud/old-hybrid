import sharp from 'sharp';
import { openai } from '../shared/openaiClient';
import { redis } from '../shared/redisClient';
import { uploadToR2 } from '../shared/storage';

export interface PhotoResult {
  url:          string;
  thumbnailUrl: string;
}

const PLACEHOLDER_URL = 'https://placehold.co/800x800/EEE/31343C?text=No+Photo';
const PLACEHOLDER_THUMB = 'https://placehold.co/200x200/EEE/31343C?text=No+Photo';

export async function generateProductPhoto(
  name:        string,
  description: string,
  category:    string,
  tenantId:    string
): Promise<PhotoResult> {
  const lockKey = `photo:lock:${tenantId}:${Buffer.from(name).toString('base64').slice(0, 24)}`;

  // Rate limit: one photo per product per 24h
  const locked = await redis.get(lockKey).catch(() => null);
  if (locked) return { url: locked, thumbnailUrl: locked };

  try {
    const prompt = `Professional food photography, ${name}, ${description || category} dish, 
restaurant quality, white plate, natural lighting, shallow depth of field, 
8k resolution, appetizing, Michelin star presentation`;

    const response = await openai.images.generate({
      model:   'dall-e-3',
      prompt,
      size:    '1024x1024',
      quality: 'standard',
      n:       1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) throw new Error('No image URL returned');

    // Download the image
    const imgResponse = await fetch(imageUrl);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Create 800x800 WebP
    const fullBuffer = await sharp(inputBuffer)
      .resize(800, 800, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();

    // Create 200x200 thumbnail
    const thumbBuffer = await sharp(inputBuffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 75 })
      .toBuffer();

    const key       = `products/${tenantId}/${Date.now()}_${name.replace(/\s+/g, '-')}.webp`;
    const thumbKey  = `products/${tenantId}/${Date.now()}_${name.replace(/\s+/g, '-')}_thumb.webp`;

    const [url, thumbnailUrl] = await Promise.all([
      uploadToR2(key,      fullBuffer,  'image/webp'),
      uploadToR2(thumbKey, thumbBuffer, 'image/webp'),
    ]);

    await redis.setEx(lockKey, 86400, url).catch(() => {});
    return { url, thumbnailUrl };
  } catch {
    return { url: PLACEHOLDER_URL, thumbnailUrl: PLACEHOLDER_THUMB };
  }
}
