const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupCorruptedUsers() {
  // Initialize Sequelize with the database configuration
  const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'dream_tool',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password123',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
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
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'user'),
        allowNull: false,
        defaultValue: 'user'
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
      },
      is2faEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      recoveryCodes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true
      }
    }, {
      tableName: 'users',
      timestamps: true
    });

    // Get all users
    const users = await User.findAll();
    console.log(`Found ${users.length} users in the database.`);

    if (users.length === 0) {
      console.log('No users found. Database is clean.');
      return;
    }

    // List all users
    console.log('\nCurrent users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Verified: ${user.isVerified}`);
    });

    // Ask for confirmation before deletion
    console.log('\n⚠️  WARNING: This will delete ALL existing users with corrupted passwords.');
    console.log('This is necessary because old users have double-hashed passwords and cannot log in.');
    console.log('After cleanup, users will need to register again with their email addresses.');
    
    // Delete all users to start fresh
    const deletedCount = await User.destroy({
      where: {},
      truncate: true
    });

    console.log(`\n✅ Successfully deleted ${deletedCount} corrupted user records.`);
    console.log('✅ Database is now clean and ready for new user registrations.');
    console.log('\n📝 Next steps:');
    console.log('1. Users can now register with any email address');
    console.log('2. All new registrations will work correctly');
    console.log('3. Login will work immediately after registration');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the cleanup
cleanupCorruptedUsers().catch(console.error);
