export const APPLICATION_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const APPLICATION_ALLOWED_MIME_TYPES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

export function isAllowedApplicationMimeType(mimeType: string): boolean {
  return APPLICATION_ALLOWED_MIME_TYPES.has(mimeType);
}
