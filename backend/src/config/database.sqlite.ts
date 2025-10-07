// Temporary SQLite database configuration for testing
// This bypasses PostgreSQL connection issues and allows backend to start immediately

import { Sequelize } from 'sequelize';

console.log('🔄 Using temporary SQLite database for testing...');

// Create in-memory SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // In-memory database for quick testing
  logging: (msg) => console.log('🗃️ [SQLite]', msg),
  define: {
    timestamps: true,
    underscored: true,
  },
});

export default sequelize;

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ SQLite database connection established successfully.');
  })
  .catch((error) => {
    console.error('❌ Unable to connect to SQLite database:', error);
  });
