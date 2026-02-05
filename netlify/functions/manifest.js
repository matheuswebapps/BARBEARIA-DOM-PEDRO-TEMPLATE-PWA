/**
 * Netlify Function: dynamic PWA manifest
 * It reads shop_settings (Supabase) and returns a manifest that points to the current app icon.
 *
 * ENV required in Netlify (Site settings -> Environment variables):
 * - SUPABASE_URL (or VITE_SUPABASE_URL)
 * - SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)
 *
 * Optional:
 * - DEFAULT_SITE_KEY (defaults to "default")
 */

function getBaseUrl(event) {
  const proto = event.headers["x-forwarded-proto"] || "https";
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  return `${proto}://${host}`;
}

function normalizeUrl(baseUrl, maybeUrl) {
  if (!maybeUrl) return null;
  if (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://")) return maybeUrl;
  if (maybeUrl.startsWith("/")) return baseUrl + maybeUrl;
  return baseUrl + "/" + maybeUrl;
}

function withVersion(url, version) {
  if (!url || !version) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(version)}`;
}

exports.handler = async (event) => {
  try {
    const baseUrl = getBaseUrl(event);

    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    const siteKey =
      (event.queryStringParameters && event.queryStringParameters.site_key) ||
      process.env.DEFAULT_SITE_KEY ||
      "default";

    // Fallback manifest if env isn't configured yet
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const fallback = {
        name: "Site",
        short_name: "Site",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FDFBF7",
        theme_color: "#2C1A1D",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      };

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/manifest+json; charset=utf-8",
          "Cache-Control": "no-store, max-age=0"
        },
        body: JSON.stringify(fallback)
      };
    }

    // Query Supabase REST (public read policy should allow this)
    const url =
      `${SUPABASE_URL.replace(/\/$/, "")}` +
      `/rest/v1/shop_settings?select=name,app_icon_url,updated_at,theme_color,background_color` +
      `&site_key=eq.${encodeURIComponent(siteKey)}&limit=1`;

    const resp = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      }
    });

    let row = null;
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) row = data[0];
    }

    const name = (row && row.name) ? row.name : "Site";
    const iconRaw = row && row.app_icon_url ? row.app_icon_url : null;
    const updatedAt = row && row.updated_at ? row.updated_at : null;

    const fallbackIcon512 = `${baseUrl}/icons/icon-512.png`;
    const icon512 = withVersion(normalizeUrl(baseUrl, iconRaw) || fallbackIcon512, updatedAt || "");
    const icon192 = icon512; // use same image; Chrome will downscale if needed
    const iconMaskable = icon512;

    const manifest = {
      name,
      short_name: name.length > 12 ? name.slice(0, 12) : name,
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#FDFBF7",
      theme_color: "#2C1A1D",
      icons: [
        { src: icon192, sizes: "192x192", type: "image/png" },
        { src: icon512, sizes: "512x512", type: "image/png" },
        { src: iconMaskable, sizes: "512x512", type: "image/png", purpose: "maskable" }
      ]
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      },
      body: JSON.stringify(manifest)
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      },
      body: JSON.stringify({
        name: "Site",
        short_name: "Site",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FDFBF7",
        theme_color: "#2C1A1D",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      })
    };
  }
};
