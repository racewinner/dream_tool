const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Initialize Sequelize with the same config as the app
const sequelize = new Sequelize(
  process.env.DB_NAME || 'dream_tool',
  process.env.DB_USER || 'postgres', 
  process.env.DB_PASSWORD || 'password123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false
  }
);

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'user'),
    defaultValue: 'user',
    allowNull: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Add comparePassword method
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

async function debugAuth() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const testEmail = 'olivia@greenempowerment.org';
    console.log(`\n🔍 Looking for user: ${testEmail}`);
    
    const user = await User.findOne({ where: { email: testEmail } });
    
    if (!user) {
      console.log('❌ User not found');
      
      // List all users
      console.log('\n📋 All users in database:');
      const allUsers = await User.findAll({ 
        attributes: ['id', 'email', 'isVerified', 'role'],
        order: [['createdAt', 'ASC']]
      });
      
      if (allUsers.length === 0) {
        console.log('   No users found in database');
      } else {
        allUsers.forEach(u => {
          console.log(`   - ${u.email} (verified: ${u.isVerified}, role: ${u.role})`);
        });
      }
      
      return;
    }

    console.log(`✅ User found: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Verified: ${user.isVerified}`);
    console.log(`   Password hash exists: ${!!user.password}`);
    console.log(`   Password hash length: ${user.password ? user.password.length : 'N/A'}`);

    // Test password verification with common passwords
    const testPasswords = ['password', 'password123', 'admin', '123456', 'test'];
    
    console.log('\n🔐 Testing password verification...');
    for (const testPassword of testPasswords) {
      try {
        const isValid = await user.comparePassword(testPassword);
        console.log(`   Testing "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        if (isValid) {
          console.log(`   🎉 FOUND WORKING PASSWORD: "${testPassword}"`);
          break;
        }
      } catch (error) {
        console.log(`   Error testing "${testPassword}": ${error.message}`);
      }
    }

    // Check if user is verified
    if (!user.isVerified) {
      console.log('\n⚠️  User is NOT verified - this will cause login to fail');
      console.log('   Setting user as verified for testing...');
      await user.update({ isVerified: true });
      console.log('   ✅ User is now verified');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔚 Database connection closed');
  }
}

debugAuth();
