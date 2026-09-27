import { createHash } from 'node:crypto';
// Refresh tokens already have cryptographic entropy; hash every byte, unlike
// bcrypt's 72-byte input limit. Legacy bcrypt records require a fresh login.
export const hashRefreshToken = token => createHash('sha256').update(token).digest('hex');
