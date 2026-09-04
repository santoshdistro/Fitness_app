// Preset photo backdrops for Liquid glass mode. Hotlinked stock photos (same
// approach as the app's other imagery); if one fails to load the aurora shows.

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;
}

export const BACKDROP_PRESETS: { id: string; label: string; url: string }[] = [
  { id: 'gym-dark', label: 'Dark gym', url: 'https://images.pexels.com/photos/29392546/pexels-photo-29392546.jpeg?auto=compress&cs=tinysrgb&w=1200' },
  { id: 'weights', label: 'Weights', url: unsplash('1517836357463-d25dfeac3438') },
  { id: 'barbell', label: 'Barbell', url: unsplash('1534438327276-14e5300c3a48') },
  { id: 'track', label: 'Neon', url: unsplash('1571902943202-507ec2618e8f') },
];

// Downscale a picked image in the browser so it stays small in localStorage.
export function downscaleImage(file: File, maxW = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be loaded.'));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unavailable.'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
