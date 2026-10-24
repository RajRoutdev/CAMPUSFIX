import { getDatabaseClient } from './db';
import crypto from 'node:crypto';

/**
 * Uploads a base64 data URI to Supabase Storage ('campusfix-images').
 * Returns the public CDN URL on success.
 * If Supabase Storage is unconfigured, unreachable, or fails, returns the original image string
 * gracefully so local/demo/offline modes continue without disruption.
 */
export async function uploadIssueImage(
  dataUriOrUrl: string,
  folder: 'original' | 'resolution' = 'original'
): Promise<string> {
  if (!dataUriOrUrl || typeof dataUriOrUrl !== 'string') return '';
  if (!dataUriOrUrl.startsWith('data:image/')) {
    // Already a remote URL or non-data URL
    return dataUriOrUrl;
  }

  try {
    const supabase = getDatabaseClient();

    // Parse base64 data URI
    const match = dataUriOrUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) return dataUriOrUrl;

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const { data, error } = await supabase.storage
      .from('campusfix-images')
      .upload(fileName, buffer, {
        contentType: `image/${rawExt}`,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: publicData } = supabase.storage
        .from('campusfix-images')
        .getPublicUrl(data.path);

      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }
  } catch {
    // Supabase Storage offline or bucket not yet provisioned; proceed gracefully
  }

  return dataUriOrUrl;
}
