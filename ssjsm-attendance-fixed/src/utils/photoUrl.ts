/**
 * Converts any Google Drive photo URL to a direct-image URL.
 *
 * IMPORTANT: For images to work for ALL users, the Google Drive file must be:
 *   1. Right-click the image in Google Drive
 *   2. Click "Share" 
 *   3. Change "Restricted" to "Anyone with the link"
 *   4. Click "Done"
 *
 * Supported inputs:
 *   https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID&export=view
 *   https://drive.google.com/thumbnail?id=FILE_ID
 *   https://lh3.googleusercontent.com/d/FILE_ID
 *   bare FILE_ID (20+ chars alphanumeric)
 */
export function normalizePhotoUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';

  // Skip non-image google links
  if (trimmed.includes('docs.google.com/spreadsheets')) return '';

  // Extract Google Drive file ID from various URL patterns
  let fileId: string | null = null;

  // Pattern: /file/d/FILE_ID/
  const p1 = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (p1) fileId = p1[1];

  // Pattern: open?id=FILE_ID
  if (!fileId) {
    const p2 = trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (p2) fileId = p2[1];
  }

  // Pattern: uc?id=FILE_ID or uc?export=view&id=FILE_ID
  if (!fileId) {
    const p3 = trimmed.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (p3) fileId = p3[1];
  }

  // Pattern: thumbnail?id=FILE_ID
  if (!fileId) {
    const p4 = trimmed.match(/drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/);
    if (p4) fileId = p4[1];
  }

  // Pattern: lh3.googleusercontent.com/d/FILE_ID
  if (!fileId) {
    const p5 = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (p5) fileId = p5[1];
  }

  // Pattern: bare file ID string (20+ alphanumeric chars, no dots or slashes)
  if (!fileId && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    fileId = trimmed;
  }

  if (fileId) {
    // Use uc?export=view — this is the most reliable public endpoint
    // The file MUST be shared with "Anyone with the link" for this to work
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Not a Google Drive URL — return as-is (imgur, imgbb, direct URLs, etc.)
  return trimmed;
}

/**
 * Alternative image hosting services (free, no login required):
 * - https://imgbb.com/ — upload image, copy "Direct link"
 * - https://postimages.org/ — upload image, copy "Direct link"  
 * - https://imgur.com/ — upload image, copy image URL
 * 
 * These services provide direct image URLs that work everywhere.
 */
