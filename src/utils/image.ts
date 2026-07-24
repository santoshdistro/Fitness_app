export type EncodedImage = { data: string; mediaType: 'image/jpeg' };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

/**
 * Downscales an image file to a max dimension and re-encodes as JPEG, returning
 * the base64 payload (no data: prefix). Keeps upload size + vision token cost
 * low, and normalises HEIC/PNG/etc. to a format the API always accepts.
 */
export async function fileToDownscaledBase64(
  file: File,
  maxDim = 1024,
  quality = 0.82,
): Promise<EncodedImage> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { data: dataUrl.split(',')[1] ?? '', mediaType: 'image/jpeg' };
}
