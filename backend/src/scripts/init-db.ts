import { sequelize } from '../models';
import { Facility, Asset, Survey, Maintenance, WhatsApp, User } from '../models';

async function initDatabase() {
  try {
    // Drop all tables if they exist
    await sequelize.drop();

    // Create tables
    await sequelize.sync({ force: true });

    // Create initial admin user
    await User.create({
      email: 'admin@example.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      role: 'admin',
      fullName: 'Admin User',
    });

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
