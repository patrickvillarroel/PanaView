const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware que va DESPUÉS de upload.single().
 * Toma el archivo guardado por multer, lo reescala (máx. 1280 px de ancho)
 * y lo convierte a WebP con calidad 80.
 * Borra el original si tenía otra extensión y actualiza req.file en su lugar.
 */
module.exports = async function compressImage(req, res, next) {
  if (!req.file) return next();

  const inputPath = req.file.path;
  const dir = path.dirname(inputPath);
  const baseName = path.basename(req.file.filename, path.extname(req.file.filename));
  const outputFilename = `${baseName}.webp`;
  const outputPath = path.join(dir, outputFilename);

  try {
    await sharp(inputPath)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Borrar el original si cambió de extensión
    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    req.file.filename = outputFilename;
    req.file.path = outputPath;
    req.file.mimetype = 'image/webp';

    next();
  } catch (err) {
    // Si sharp falla por alguna razón, continuar con el archivo original
    console.error('[compressImage] Error al comprimir imagen:', err.message);
    next();
  }
};
