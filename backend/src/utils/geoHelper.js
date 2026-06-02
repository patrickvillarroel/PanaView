// Calcula la distancia entre dos puntos usando la fórmula de Haversine
// Retorna la distancia en metros
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Radio de la Tierra en metros
  
  const rad1 = toRad(lat1);
  const rad2 = toRad(lat2);
  const deltaLat = toRad(lat2 - lat1);
  const deltaLng = toRad(lng2 - lng1);
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(rad1) * Math.cos(rad2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  
  return Math.round(distancia);
}

// Convierte grados a radianes
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = {
  calcularDistancia,
};
