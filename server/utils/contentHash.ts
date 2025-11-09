import crypto from 'crypto';

/**
 * Calculate SHA256 hash of content
 * Used for change detection and caching
 */
export function calculateContentHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

/**
 * Compare two content hashes
 */
export function compareContentHash(
  hash1: string,
  hash2: string
): boolean {
  return hash1 === hash2;
}






