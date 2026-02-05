
/**
 * Generates a URL-friendly slug from a string.
 * Used for WhatsApp message identifiers.
 * Example: "Fio & Navalha" -> "fio-e-navalha"
 */
export const generateSlug = (text: string | undefined | null): string => {
  if (!text) return 'barbearia';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Split accents from characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-e-') // Replace & with -e-
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

export const generateId = (prefix = ''): string => {
  const raw = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}${raw}` : raw;
};
