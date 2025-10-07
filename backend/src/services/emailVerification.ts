import { User } from '../models';
import { UserInstance } from '../models/user';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import createTestAccount from '../config/test-email';

dotenv.config();

// Create a transporter based on the environment
let transporter: nodemailer.Transporter = nodemailer.createTransport({
  streamTransport: true,
  newline: 'unix',
  buffer: true
});

if (process.env.NODE_ENV === 'production') {
  // Use real email service in production
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: true
    }
  });
} else {
  // Use test email service in development
  const initTestTransporter = async () => {
    const { transporter: testTransporter, testAccount } = await createTestAccount();
    console.log('Test email account created:');
    console.log('Ethereal Email:', testAccount.user);
    console.log('Ethereal Password:', testAccount.pass);
    console.log('Ethereal Web URL: https://ethereal.email/login');
    return testTransporter;
  };
  
  // Initialize the test transporter immediately
  (async () => {
    try {
      transporter = await initTestTransporter();
    } catch (error) {
      console.error('Failed to initialize test email transporter:', error);
      // Fallback to console logging emails in case of failure
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  })();
  
  // Create a simple transporter that logs emails to console
  const consoleTransporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
  
  // Use console transporter as fallback
  if (!transporter) {
    transporter = consoleTransporter;
  }
}

export interface EmailVerificationToken {
  userId: number;
  token: string;
  expiresAt: Date;
}

export class EmailVerificationService {
  private static instance: EmailVerificationService;
  private verificationTokens: Map<string, EmailVerificationToken> = new Map();

  private constructor() {}

  public static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  async generateVerificationToken(userId: number): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    this.verificationTokens.set(token, {
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async verifyToken(token: string): Promise<number | null> {
    const verificationToken = this.verificationTokens.get(token);
    if (!verificationToken) {
      return null;
    }

    if (verificationToken.expiresAt < new Date()) {
      this.verificationTokens.delete(token);
      return null;
    }

    return verificationToken.userId;
  }

  async sendVerificationEmail(user: UserInstance, token: string): Promise<void> {
    // In development, automatically verify the email
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Auto-verifying email for: ${user.email}`);
      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpiresAt = null;
      // Use update with individual fields to avoid triggering beforeUpdate hook
      await user.save({ fields: ['isVerified', 'verificationToken', 'verificationTokenExpiresAt'] });
      return;
    }

    // In production, send actual verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Hello ${user.firstName} ${user.lastName},</h2>
        <p>Please click the following link to verify your email address:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you did not request this email, please ignore it.</p>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  async cleanExpiredTokens(): Promise<void> {
    const now = new Date();
    for (const [token, verificationToken] of this.verificationTokens) {
      if (verificationToken.expiresAt < now) {
        this.verificationTokens.delete(token);
      }
    }
  }
}

export const emailVerificationService = EmailVerificationService.getInstance();
