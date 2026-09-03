import { ProjectSitePhoto } from '../types';

/**
 * Compress an image file using browser Canvas to a lightweight JPEG Data URL
 * suitable for localStorage and IndexedDB persistence (< 200KB per photo)
 */
export async function processAndCompressImageFile(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    caption?: string;
    category?: ProjectSitePhoto['category'];
    roomRefId?: string;
    roomName?: string;
  } = {}
): Promise<ProjectSitePhoto> {
  const {
    maxWidth = 1280,
    maxHeight = 960,
    quality = 0.82,
    caption = '',
    category = 'existing-substrate',
    roomRefId = 'project-level',
    roomName = 'Project Wide / General Site',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate aspect-ratio preserved dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Draw image with smooth bilinear scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Calculate size in KB
        const head = 'data:image/jpeg;base64,';
        const base64Length = dataUrl.length - head.length;
        const fileSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const sitePhoto: ProjectSitePhoto = {
          id: photoId,
          dataUrl,
          caption: caption || file.name.replace(/\.[^/.]+$/, ''),
          category,
          timestamp: new Date().toISOString(),
          fileName: file.name,
          fileSizeKb,
          roomRefId,
          roomName,
          dimensions: { width, height },
        };

        resolve(sitePhoto);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image file for processing'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Empty file reader result'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file from disk'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const PHOTO_CATEGORIES: Array<{
  id: ProjectSitePhoto['category'];
  label: string;
  description: string;
  badgeColor: string;
}> = [
  {
    id: 'existing-substrate',
    label: 'Substrate & Decking',
    description: 'Concrete, corrugated deck, or bar joists ready for spray',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  {
    id: 'mep-obstructions',
    label: 'MEP & Clearances',
    description: 'Ductwork, conduit runs, plumbing pipes, or fire sprinklers',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'access-staging',
    label: 'Access & Staging',
    description: 'Scaffolding, scissor lifts, floor loading, and hose routes',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  {
    id: 'substrate-defect',
    label: 'Substrate Defect / Oil',
    description: 'Form release oil, rust, moisture leaks, or laitance needing prep',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  {
    id: 'completed-spray',
    label: 'Spray Application',
    description: 'Monolithic finish, thickness pin checks, or tamped smooth',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'general-site',
    label: 'General Site View',
    description: 'Overall facility exterior, room layout, or staging area',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  },
];
