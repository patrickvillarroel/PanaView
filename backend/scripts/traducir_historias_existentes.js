/**
 * Script one-time: traduce al inglés la `historia` de los lugares que ya
 * existían antes de agregar el campo `historia_en`.
 *
 * Requisito previo: haber aplicado scripts/migrate_historia_en.sql
 *
 * Uso:
 *   node scripts/traducir_historias_existentes.js
 */

'use strict';

require('dotenv').config();
const { Op } = require('sequelize');
const { Lugar, sequelize } = require('../src/models');
const { traducirTexto } = require('../src/utils/traducir');

async function main() {
  console.log('\n🌐 PanaView — Traducción de historias existentes (ES → EN)\n');

  const lugares = await Lugar.findAll({
    where: { historia: { [Op.ne]: null } },
  });

  let traducidos = 0;
  let saltados = 0;
  let fallidos = 0;

  for (const lugar of lugares) {
    if (!lugar.historia || !lugar.historia.trim()) continue;

    if (lugar.historia_en && lugar.historia_en.trim()) {
      console.log(`  [skip] ${lugar.nombre} — ya tiene traducción`);
      saltados++;
      continue;
    }

    process.stdout.write(`  ${lugar.nombre} … `);
    const traduccion = await traducirTexto(lugar.historia);

    if (traduccion) {
      lugar.historia_en = traduccion;
      await lugar.save();
      console.log('✓');
      traducidos++;
    } else {
      console.log('✗ no se pudo traducir');
      fallidos++;
    }
  }

  await sequelize.close();

  console.log('\n' + '─'.repeat(50));
  console.log(`Traducidos : ${traducidos}`);
  console.log(`Ya tenían  : ${saltados}`);
  console.log(`Fallidos   : ${fallidos}`);
  console.log('');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
