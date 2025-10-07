const { User } = require('../src/models');

async function checkUsers() {
  try {
    const users = await User.findAll();
    console.log('Users in database:');
    users.forEach(u => {
      console.log(`- ${u.email} (ID: ${u.id}, Verified: ${u.isVerified})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
