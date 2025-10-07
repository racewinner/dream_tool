import nodemailer from 'nodemailer';

// Create a test account with Ethereal Email
// This is a fake SMTP service for testing
const createTestAccount = async () => {
  try {
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    // Create a transporter object using the test account
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
      // Disable certificate validation in development
      tls: {
        rejectUnauthorized: false
      }
    });
    
    return {
      transporter,
      testAccount
    };
  } catch (error) {
    console.error('Error creating test email account:', error);
    throw error;
  }
};

export default createTestAccount;
