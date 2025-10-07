const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyTestUser() {
  // Initialize Sequelize with the database configuration
  // Use 'localhost' as the host when connecting from the host machine to Docker
  const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'dream_tool', // Default to 'dream_tool' if not set
    username: process.env.DB_USER || 'postgres',   // Default to 'postgres' if not set
    password: process.env.DB_PASSWORD || 'password123', // Default password from docker-compose.yml
    host: 'localhost', // Connect to localhost (Docker maps the port to the host)
    port: 5432, // Default PostgreSQL port
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false // Disable SSL for local development
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Define the User model
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      verificationTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'users', // Make sure this matches your actual table name
      timestamps: true
    });

    // Find the test user by email
    const testEmail = 'testuser_9480@example.com';
    const user = await User.findOne({
      where: { email: testEmail }
    });

    if (!user) {
      console.error(`User with email ${testEmail} not found.`);
      return;
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current verification status: ${user.isVerified}`);

    // If not already verified, verify the user
    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpiresAt = null;
      await user.save();
      console.log('User has been manually verified.');
    } else {
      console.log('User is already verified.');
    }

  } catch (error) {
    console.error('Error verifying test user:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the verification
verifyTestUser().catch(console.error);
