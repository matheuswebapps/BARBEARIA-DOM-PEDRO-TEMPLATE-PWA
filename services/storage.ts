import { getSupabase } from './supabaseClient';

export type StorageFolder = 'branding' | 'cuts' | 'products';

// Support both env names (older templates used VITE_SUPABASE_STORAGE_BUCKET)
// Bucket used by uploads. Prefer env, but gracefully fall back to common names
// so the template keeps working even if a project was created with a slightly
// different bucket id (e.g. "site__assets").
const PRIMARY_BUCKET = (
  import.meta.env.VITE_STORAGE_BUCKET ||
  import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ||
  'public'
).trim() || 'public';

const FALLBACK_BUCKETS = ['site__assets', 'site_assets', 'public'];

const getCandidateBuckets = (): string[] => {
  const list = [PRIMARY_BUCKET, ...FALLBACK_BUCKETS];
  // de-duplicate while preserving order
  return Array.from(new Set(list.map(s => (s || '').trim()).filter(Boolean)));
};

// Basic filename sanitizer (keeps extension)
export const sanitizeFilename = (name: string): string => {
  const trimmed = name.trim().toLowerCase();
  const parts = trimmed.split('.');
  const ext = parts.length > 1 ? `.${parts.pop()}` : '';
  const base = parts.join('.') || 'file';
  const safeBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now();
  return `${safeBase || 'file'}-${ts}-${rand}${ext}`;
};

export const uploadImageToSupabase = async (
  folder: StorageFolder,
  file: File
): Promise<{ publicUrl: string; path: string }> => {
  const supabase = getSupabase();
  const filename = sanitizeFilename(file.name);
  const path = `${folder}/${filename}`;

  let lastErr: any = null;
  for (const bucket of getCandidateBuckets()) {
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || 'image/*',
        cacheControl: '3600',
      });

    if (upErr) {
      lastErr = upErr;
      // try next bucket on any storage error (bucket missing, policies, etc.)
      continue;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      lastErr = new Error('Failed to generate public URL for uploaded image.');
      continue;
    }
    return { publicUrl: data.publicUrl, path };
  }

  throw lastErr || new Error('Falha ao enviar imagem para o Storage.');
};

export const removeImageFromSupabase = async (path: string): Promise<void> => {
  const supabase = getSupabase();
  if (!path) return;
  let lastErr: any = null;
  for (const bucket of getCandidateBuckets()) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (!error) return;
    lastErr = error;
  }
  if (lastErr) throw lastErr;
};

export const tryExtractStoragePathFromPublicUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    // Typical public url: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const marker = '/storage/v1/object/public/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const after = u.pathname.slice(idx + marker.length); // <bucket>/<path>
    const parts = after.split('/');
    if (parts.length < 2) return null;
    parts.shift(); // drop bucket
    return parts.join('/');
  } catch {
    return null;
  }
};
