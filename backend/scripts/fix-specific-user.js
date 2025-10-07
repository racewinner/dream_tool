const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixSpecificUser() {
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

    const targetEmail = 'olivia@greenempowerment.org';
    const newPassword = 'YourPassword123!'; // You can change this

    // Find the user
    const user = await User.findOne({ where: { email: targetEmail } });
    
    if (!user) {
      console.log(`❌ User ${targetEmail} not found.`);
      return;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current verification status: ${user.isVerified}`);

    // Hash the new password properly
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user with correct password hash and verification status
    await user.update({
      password: hashedPassword,
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiresAt: null
    });

    console.log(`✅ Successfully fixed user ${targetEmail}:`);
    console.log(`   - Password reset to: ${newPassword}`);
    console.log(`   - Email verified: true`);
    console.log(`   - Ready for login!`);

  } catch (error) {
    console.error('Error fixing user:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the fix
fixSpecificUser().catch(console.error);
