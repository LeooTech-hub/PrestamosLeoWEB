export const getDniInfo = async (req, res) => {
  try {
    const { dni } = req.params;

    if (!dni || !/^\d{8}$/.test(dni.trim())) {
      return res.status(400).json({
        error: 'El DNI debe contener exactamente 8 dígitos numéricos',
      });
    }

    const cleanDni = dni.trim();
    const token = process.env.RENIEC_API_TOKEN || '';

    let apiData = null;
    const endpoints = [];

    if (token) {
      endpoints.push({
        url: `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}?token=${token}`,
        headers: {},
      });
      endpoints.push({
        url: `https://apiperu.dev/api/dni/${cleanDni}`,
        headers: { Authorization: `Bearer ${token}` },
      });
      endpoints.push({
        url: `https://api.apis.net.pe/v2/reniec/dni?numero=${cleanDni}`,
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    endpoints.push({
      url: `https://api.apis.net.pe/v1/dni?numero=${cleanDni}`,
      headers: {},
    });
    endpoints.push({
      url: `https://dniruc.apisperu.com/api/v1/dni/${cleanDni}`,
      headers: {},
    });

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const resp = await fetch(ep.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...ep.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
          const json = await resp.json();
          const dataObj = json.data || json;

          const names = (dataObj.nombres || dataObj.names || '').trim();
          const firstSurname = (dataObj.apellidoPaterno || dataObj.apellido_paterno || dataObj.firstSurname || '').trim();
          const lastSurname = (dataObj.apellidoMaterno || dataObj.apellido_materno || dataObj.lastSurname || '').trim();

          let fullName = (dataObj.nombre_completo || dataObj.fullName || '').trim();
          if (!fullName && (names || firstSurname || lastSurname)) {
            fullName = `${names} ${firstSurname} ${lastSurname}`.replace(/\s+/g, ' ').trim();
          }

          if (fullName) {
            apiData = {
              dni: cleanDni,
              fullName,
              names,
              firstSurname,
              lastSurname,
            };
            break;
          }
        }
      } catch (err) {
        console.warn(`[RENIEC] Error consultando ${ep.url}:`, err.message);
      }
    }

    if (!apiData) {
      return res.status(404).json({
        error: 'No se encontraron datos para el DNI ingresado',
      });
    }

    return res.json(apiData);
  } catch (error) {
    console.error('[RENIEC] Error interno en servidor:', error);
    return res.status(500).json({
      error: 'Error al consultar el servicio externo de RENIEC',
    });
  }
};

export default {
  getDniInfo,
};
