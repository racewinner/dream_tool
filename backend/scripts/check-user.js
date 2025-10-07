const path = require('path');
const { User } = require(path.join(__dirname, '..', 'src', 'models'));
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    console.log('🔍 Checking user in database...');
    
    // Find the user
    const user = await User.findOne({ 
      where: { email: 'olivia@greenempowerment.org' } 
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- First Name:', user.firstName);
    console.log('- Last Name:', user.lastName);
    console.log('- Role:', user.role);
    console.log('- Is Verified:', user.isVerified);
    console.log('- Password Hash:', user.password ? 'Present' : 'Missing');
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'password123'; // Common test password
    
    if (user.password) {
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`- Password "${testPassword}" valid:`, isValid);
      
      // Try a few common passwords
      const commonPasswords = ['password', '123456', 'admin', 'test'];
      for (const pwd of commonPasswords) {
        const valid = await bcrypt.compare(pwd, user.password);
        if (valid) {
          console.log(`✅ Found working password: "${pwd}"`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();
