const getConfig = () => {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_DNI_BUCKET || 'client-documents';

  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    throw new Error('Configuración de Supabase Storage incompleta');
  }

  return { supabaseUrl, serviceRoleKey, bucket };
};

const encodeObjectPath = (path) => String(path)
  .split('/')
  .map((part) => encodeURIComponent(part))
  .join('/');

const storageHeaders = (serviceRoleKey, extra = {}) => ({
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  ...extra,
});

const readSafeError = async (response) => {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch (_) {
    return `HTTP ${response.status}`;
  }
};

export const uploadDniObject = async (path, buffer, mimeType) => {
  const { supabaseUrl, serviceRoleKey, bucket } = getConfig();
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(path)}`,
    {
      method: 'POST',
      headers: storageHeaders(serviceRoleKey, {
        'Content-Type': mimeType,
        'x-upsert': 'true',
      }),
      body: buffer,
    }
  );

  if (!response.ok) {
    const detail = await readSafeError(response);
    throw new Error(`Supabase Storage rechazó la imagen (${response.status}): ${detail}`);
  }

  return path;
};

export const createSignedDniUrl = async (path, expiresInSeconds = 300) => {
  if (!path) return null;

  const { supabaseUrl, serviceRoleKey, bucket } = getConfig();
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectPath(path)}`,
    {
      method: 'POST',
      headers: storageHeaders(serviceRoleKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    }
  );

  if (!response.ok) {
    const detail = await readSafeError(response);
    throw new Error(`No se pudo firmar la imagen DNI (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const signedPath = data?.signedURL || data?.signedUrl || data?.signed_url;
  if (!signedPath) {
    throw new Error('Supabase Storage no devolvió una URL firmada');
  }

  if (/^https?:\/\//i.test(signedPath)) return signedPath;
  if (signedPath.startsWith('/storage/v1/')) return `${supabaseUrl}${signedPath}`;
  return `${supabaseUrl}/storage/v1${signedPath.startsWith('/') ? '' : '/'}${signedPath}`;
};

export const deleteDniObject = async (path) => {
  if (!path) return;

  const { supabaseUrl, serviceRoleKey, bucket } = getConfig();
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectPath(path)}`,
    {
      method: 'DELETE',
      headers: storageHeaders(serviceRoleKey),
    }
  );

  if (response.ok || response.status === 404) return;

  const detail = await readSafeError(response);
  throw new Error(`No se pudo eliminar la imagen DNI (${response.status}): ${detail}`);
};
