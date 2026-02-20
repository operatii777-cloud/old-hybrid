export async function generateProductPhoto(
  name: string,
  _desc: string,
  _cat: string,
  _tenantId: string
): Promise<{ url: string; thumbnailUrl: string }> {
  if (process.env.SKIP_PHOTOS === 'true') {
    return { url: '', thumbnailUrl: '' };
  }
  throw new Error('Photo generation requires OPENAI_API_KEY with DALL-E 3');
}
