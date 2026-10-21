import { environment } from '../../environments/environment';

export type MediaFolder = 'uploads' | 'videos' | 'images' | 'audios' | 'audio' | 'certificates';

/** Đường dẫn file tĩnh của backend (wwwroot/<folder>/<file>). */
export function mediaUrl(file: string | null | undefined, folder: MediaFolder): string {
  if (!file) return '';
  if (/^(https?:|data:|blob:)/.test(file)) return file;
  if (file.startsWith('/')) return `${environment.serverUrl}${file}`;
  return `${environment.serverUrl}/${folder}/${file}`;
}

export function initialOf(name: string | null | undefined): string {
  return (name || 'U').trim().charAt(0).toUpperCase() || 'U';
}
