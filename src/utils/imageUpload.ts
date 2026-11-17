const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i;
const STORAGE_ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

function inferImageExtension(file: File): string {
  const nameMatch = file.name?.match(/\.([a-zA-Z0-9]+)$/);
  if (nameMatch) return nameMatch[1].toLowerCase();
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

function normalizeMimeForStorage(file: File): string {
  const lower = (file.type || '').toLowerCase();
  if (lower === 'image/jpg' || lower === 'image/jpeg') return 'image/jpeg';
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/webp') return 'image/webp';
  const ext = inferImageExtension(file);
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return '';
}

export function isLikelyImageFile(file: File): boolean {
  const mime = (file.type || '').toLowerCase();
  if (mime === 'image/svg+xml') return false;
  if (mime.startsWith('image/')) return true;
  if (!mime && IMAGE_EXTENSION_RE.test(file.name || '')) return true;
  return IMAGE_EXTENSION_RE.test(file.name || '');
}

async function decodeImageDimensionsAndDraw(
  file: File,
  maxDimension: number
): Promise<{ canvas: HTMLCanvasElement }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, maxDimension / Math.max(bitmap.width || 1, bitmap.height || 1));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable.');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        return { canvas };
      } finally {
        bitmap.close();
      }
    } catch {
      // Fall through to HTMLImageElement loader
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file.'));
      el.src = objectUrl;
    });
    const natW = img.naturalWidth || img.width || 1;
    const natH = img.naturalHeight || img.height || 1;
    const scale = Math.min(1, maxDimension / Math.max(natW, natH));
    const width = Math.max(1, Math.round(natW * scale));
    const height = Math.max(1, Math.round(natH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return { canvas };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode compressed JPEG photo.'));
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Normalizes, resizes (max 800x800), and compresses mobile/desktop photos to JPEG (< 5MB)
 * so Android camera shots, HEIC/PNG photos, and files with empty MIME types upload reliably
 * and satisfy Firebase Storage rules (image/(jpeg|jpg|png|webp) & size < 5MB).
 */
export async function prepareAvatarImageFile(file: File): Promise<File> {
  if (!isLikelyImageFile(file)) {
    throw new Error('Please choose a valid photo (JPG, PNG, WebP, or mobile camera image).');
  }
  if (file.size === 0) {
    throw new Error('Selected photo appears to be empty. Please choose another image.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Selected photo is too large (over 25 MB). Please choose a smaller image.');
  }

  try {
    const { canvas } = await decodeImageDimensionsAndDraw(file, 800);
    let blob = await canvasToJpegBlob(canvas, 0.86);
    if (blob.size > 1.2 * 1024 * 1024) {
      blob = await canvasToJpegBlob(canvas, 0.72);
    }
    if (blob.size >= 5 * 1024 * 1024) {
      blob = await canvasToJpegBlob(canvas, 0.55);
    }
    if (blob.size >= 5 * 1024 * 1024) {
      throw new Error('Could not compress profile photo under 5 MB. Please try a smaller image.');
    }
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  } catch (err) {
    const normalizedMime = normalizeMimeForStorage(file);
    if (STORAGE_ALLOWED_IMAGE_MIMES.has(normalizedMime) && file.size < 4.8 * 1024 * 1024) {
      return new File([file], `avatar.${normalizedMime === 'image/png' ? 'png' : normalizedMime === 'image/webp' ? 'webp' : 'jpg'}`, {
        type: normalizedMime
      });
    }
    throw new Error(
      err instanceof Error && err.message.includes('5 MB')
        ? err.message
        : 'Could not process this image format. Please select a JPG, PNG, or WebP photo.'
    );
  }
}

/**
 * Prepares verification documents (PDF or raster image) to satisfy Storage rules (< 10MB).
 */
export async function prepareDocumentFileForUpload(
  file: File
): Promise<{ file: File; contentType: string }> {
  const mime = (file.type || '').toLowerCase();
  const isPdf = mime === 'application/pdf' || /\.pdf$/i.test(file.name || '');
  if (isPdf) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Verification PDF must be smaller than 10 MB.');
    }
    return { file, contentType: 'application/pdf' };
  }

  if (!isLikelyImageFile(file)) {
    throw new Error('Please upload an image (JPG, PNG, WebP) or PDF document.');
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Selected document image is too large (over 25 MB).');
  }

  const normalizedMime = normalizeMimeForStorage(file);
  if (STORAGE_ALLOWED_IMAGE_MIMES.has(normalizedMime) && file.size < 9.5 * 1024 * 1024) {
    return { file, contentType: normalizedMime };
  }

  const { canvas } = await decodeImageDimensionsAndDraw(file, 1600);
  const blob = await canvasToJpegBlob(canvas, 0.85);
  if (blob.size >= 10 * 1024 * 1024) {
    throw new Error('Verification document must be smaller than 10 MB.');
  }
  const jpgFile = new File([blob], 'verification.jpg', { type: 'image/jpeg' });
  return { file: jpgFile, contentType: 'image/jpeg' };
}
