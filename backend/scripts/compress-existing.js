/**
 * Script one-time: comprime las imágenes ya existentes en uploads/.
 *
 * Uso:
 *   node scripts/compress-existing.js
 *   node scripts/compress-existing.js --dry-run   (solo muestra, no toca archivos)
 *
 * Qué hace:
 *  - Recorre uploads/lugares, uploads/negocios, uploads/promociones
 *  - Para cada JPEG/PNG: reescala (máx. 1280 px) y convierte a WebP (calidad 80)
 *    guardando el nuevo .webp y borrando el original
 *  - Para WebP ya existentes: solo reescala/recomprime in-place si son muy grandes
 *  - Actualiza las URLs en la base de datos para reflejar el nuevo nombre .webp
 *  - Informa el ahorro total de espacio
 */

'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { Sequelize } = require('sequelize');

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_WIDTH = 1280;
const WEBP_QUALITY = 80;
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// ── Directorios e info de tabla/columna para actualizar la BD ─────────────────
const TARGETS = [
  { dir: 'lugares',    table: 'imagenes_lugar',    column: 'url' },
  { dir: 'negocios',   table: 'imagenes_negocio',  column: 'url' },
  { dir: 'promociones',table: 'imagenes_promocion', column: 'url' },
];

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function getSequelize() {
  return new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      dialect: 'mysql',
      logging: false,
    },
  );
}

async function processFile(filePath, subfolder, sequelize) {
  const ext = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) return null;

  const stat = fs.statSync(filePath);
  const originalSize = stat.size;
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  const outputFilename = `${baseName}.webp`;
  const outputPath = path.join(dir, outputFilename);

  // Si ya es webp y el output es el mismo archivo, comprimir in-place con temp file
  const isWebp = ext === '.webp';
  const tempPath = `${outputPath}.tmp`;

  if (DRY_RUN) {
    const meta = await sharp(filePath).metadata();
    const needsResize = (meta.width ?? 0) > MAX_WIDTH;
    console.log(
      `  [dry-run] ${path.basename(filePath)} → ${outputFilename}` +
      (needsResize ? ` (resize ${meta.width}→${MAX_WIDTH}px)` : ' (recompress only)'),
    );
    return { saved: 0, original: originalSize };
  }

  try {
    await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(tempPath);

    const newSize = fs.statSync(tempPath).size;

    if (newSize >= originalSize && isWebp) {
      // El resultado pesa más o igual que el original WebP → descartar
      fs.unlinkSync(tempPath);
      return { saved: 0, original: originalSize };
    }

    // Reemplazar
    if (!isWebp && filePath !== outputPath) {
      fs.unlinkSync(filePath); // borrar original (.jpg/.png)
    } else if (isWebp) {
      fs.unlinkSync(filePath); // borrar webp original
    }
    fs.renameSync(tempPath, outputPath);

    const saved = originalSize - newSize;

    // Actualizar BD si cambió el nombre de archivo
    if (outputFilename !== path.basename(filePath)) {
      const oldUrl = `/uploads/${subfolder}/${path.basename(filePath)}`;
      const newUrl = `/uploads/${subfolder}/${outputFilename}`;
      const target = TARGETS.find((t) => t.dir === subfolder);
      if (target && sequelize) {
        await sequelize.query(
          `UPDATE \`${target.table}\` SET \`${target.column}\` = ? WHERE \`${target.column}\` = ?`,
          { replacements: [newUrl, oldUrl] },
        );
      }
    }

    return { saved, original: originalSize, newSize, filename: outputFilename };
  } catch (err) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    throw err;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🖼  PanaView — Compresión de imágenes existentes`);
  console.log(`   Max ancho: ${MAX_WIDTH}px  |  Calidad WebP: ${WEBP_QUALITY}%`);
  if (DRY_RUN) console.log('   Modo: DRY-RUN (no se modificará nada)\n');
  else console.log('');

  let sequelize;
  if (!DRY_RUN) {
    try {
      sequelize = await getSequelize();
      await sequelize.authenticate();
    } catch (err) {
      console.error('⚠  No se pudo conectar a la BD. Las URLs en la BD no se actualizarán.');
      console.error('   Asegúrate de tener el archivo .env con DB_NAME, DB_USER, DB_PASSWORD.\n');
      sequelize = null;
    }
  }

  let totalFiles = 0;
  let totalSaved = 0;
  let totalErrors = 0;

  for (const target of TARGETS) {
    const dir = path.join(UPLOADS_DIR, target.dir);
    if (!fs.existsSync(dir)) {
      console.log(`  [skip] ${target.dir}/ — directorio no existe`);
      continue;
    }

    const files = fs.readdirSync(dir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return SUPPORTED_EXTS.has(ext);
    });

    if (files.length === 0) {
      console.log(`  [skip] ${target.dir}/ — sin imágenes`);
      continue;
    }

    console.log(`📁 uploads/${target.dir}/  (${files.length} imágenes)`);

    for (const file of files) {
      const filePath = path.join(dir, file);
      process.stdout.write(`  ${file} … `);
      try {
        const result = await processFile(filePath, target.dir, sequelize);
        if (!result) {
          console.log('omitido (formato no soportado)');
        } else if (DRY_RUN) {
          // ya imprimió en processFile
        } else if (result.saved <= 0) {
          console.log(`sin cambio (ya optimizado)`);
        } else {
          console.log(
            `✓  ${fmtBytes(result.original)} → ${fmtBytes(result.newSize)}` +
            `  (−${fmtBytes(result.saved)})`,
          );
          totalSaved += result.saved;
        }
        totalFiles++;
      } catch (err) {
        console.log(`✗  ERROR: ${err.message}`);
        totalErrors++;
      }
    }
    console.log('');
  }

  if (sequelize) await sequelize.close();

  console.log('─'.repeat(50));
  console.log(`Archivos procesados : ${totalFiles}`);
  if (!DRY_RUN) {
    console.log(`Espacio ahorrado    : ${fmtBytes(totalSaved)}`);
    if (totalErrors > 0) console.log(`Errores             : ${totalErrors}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
