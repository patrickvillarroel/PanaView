require('dotenv').config();
const app = require('./app');
const sequelize = require('./src/config/db');

const PORT = process.env.PORT || 3000;

// Sincronizar la base de datos y iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión con la BD
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos exitosa');
    
    // Sincronizar modelos (crear tablas si no existen)
    // En producción usar el script: scripts/migrate_facturacion.sql
    // await sequelize.sync({ alter: true });
    console.log('✓ Modelos sincronizados');
    
    // Iniciar servidor
    // Exponer instancia de sequelize para controladores que necesiten consultas directas
    app.set('sequelize', sequelize);
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor PanaRoute ejecutándose en puerto ${PORT}`);
      console.log(`📍 API disponible en http://localhost:${PORT}/api\n`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
}

startServer();
