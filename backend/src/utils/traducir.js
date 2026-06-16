const axios = require('axios');

// Traduce texto usando la API gratuita de MyMemory (sin API key; límite ~5000
// palabras/día por IP). Si la calidad/cuota se vuelve un problema, esta es la
// única función que habría que cambiar por Google Translate / DeepL.
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

// MyMemory limita el tamaño de cada query, así que los textos largos se
// dividen en fragmentos que se traducen por separado y se vuelven a unir.
const MAX_CHARS_POR_FRAGMENTO = 480;

function dividirEnFragmentos(texto, maxChars) {
  const fragmentos = [];
  let resto = texto.trim();
  while (resto.length > maxChars) {
    let corte = resto.lastIndexOf('. ', maxChars);
    if (corte <= 0) corte = resto.lastIndexOf(' ', maxChars);
    if (corte <= 0) corte = maxChars;
    fragmentos.push(resto.slice(0, corte + 1).trim());
    resto = resto.slice(corte + 1).trim();
  }
  if (resto) fragmentos.push(resto);
  return fragmentos;
}

async function traducirFragmento(fragmento, langpair) {
  const { data } = await axios.get(MYMEMORY_URL, {
    params: { q: fragmento, langpair },
    timeout: 8000,
  });
  return data?.responseData?.translatedText ?? null;
}

/**
 * Traduce un texto completo (ej. español → inglés). Devuelve null si la
 * traducción falla, para no bloquear la operación que la solicitó.
 */
async function traducirTexto(texto, langpair = 'es|en') {
  const limpio = (texto ?? '').trim();
  if (!limpio) return null;

  try {
    const fragmentos = dividirEnFragmentos(limpio, MAX_CHARS_POR_FRAGMENTO);
    const traducciones = [];
    for (const fragmento of fragmentos) {
      const traducido = await traducirFragmento(fragmento, langpair);
      if (!traducido) return null;
      traducciones.push(traducido);
    }
    return traducciones.join(' ');
  } catch (err) {
    console.error('[traducirTexto] Error al traducir:', err.message);
    return null;
  }
}

module.exports = { traducirTexto };
