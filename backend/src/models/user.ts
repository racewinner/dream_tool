import { DataTypes, Model, ModelStatic, Optional, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import dotenv from 'dotenv';
import { emailVerificationService } from '../services/emailVerification';

dotenv.config();

dotenv.config();

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'technical_expert' | 'technical_junior' | 'non_technical';
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiresAt: Date | null;
  is2faEnabled: boolean;
  twoFactorSecret: string | null;
  recoveryCodes: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserCreationAttributes = Optional<
  UserAttributes, 
  'id' | 'isVerified' | 'verificationToken' | 'verificationTokenExpiresAt' | 
  'is2faEnabled' | 'twoFactorSecret' | 'recoveryCodes' | 'createdAt' | 'updatedAt'
>;

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateVerificationToken(): string;
  generate2FASecret(): { secret: string; otpauthUrl: string };
  verify2FAToken(token: string): boolean;
  generateRecoveryCodes(): string[];
  verifyRecoveryCode(code: string): boolean;
  generateToken(): string;
}

export const initUserModel = (sequelize: Sequelize): ModelStatic<UserInstance> => {
  const User = sequelize.define<UserInstance>('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
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
      type: DataTypes.ENUM('admin', 'technical_expert', 'technical_junior', 'non_technical'),
      defaultValue: 'non_technical',
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationTokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is2faEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    recoveryCodes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
  });

  // Add instance methods to the model
  const userMethods = {
    comparePassword: async function(this: UserInstance, candidatePassword: string): Promise<boolean> {
      return bcrypt.compare(candidatePassword, this.getDataValue('password'));
    },

    generateAuthToken: function(this: UserInstance): string {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      
      const payload = {
        id: this.getDataValue('id'),
        email: this.getDataValue('email'),
        role: this.getDataValue('role')
      };
      
      const options: SignOptions = {
        expiresIn: '24h'
      };
      
      return jwt.sign(payload, process.env.JWT_SECRET, options);
    },

    generateVerificationToken: function(this: UserInstance): string {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
      }
      return jwt.sign(
        { 
          id: this.getDataValue('id'), 
          email: this.getDataValue('email') 
        },
        process.env.JWT_SECRET + this.getDataValue('password'),
        { expiresIn: '1d' } as SignOptions
      );
    },

    generate2FASecret: function(this: UserInstance) {
      const email = this.getDataValue('email');
      const secret = speakeasy.generateSecret({
        name: `DREAM_TOOL:${email}`,
        length: 20
      });
      
      this.setDataValue('twoFactorSecret', secret.base32);
      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url || ''
      };
    },

    verify2FAToken: function(this: UserInstance, token: string): boolean {
      const twoFactorSecret = this.getDataValue('twoFactorSecret');
      if (!twoFactorSecret) return false;
      
      return speakeasy.totp.verify({
        secret: twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 1
      });
    },

    generateRecoveryCodes: function(this: UserInstance): string[] {
      const codes: string[] = [];
      for (let i = 0; i < 5; i++) {
        codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
      }
      this.setDataValue('recoveryCodes', codes);
      return codes;
    },

    verifyRecoveryCode: function(this: UserInstance, code: string): boolean {
      const recoveryCodes = this.getDataValue('recoveryCodes');
      if (!recoveryCodes) return false;
      
      // Ensure recoveryCodes is treated as an array of strings
      const codesArray = Array.isArray(recoveryCodes) ? recoveryCodes : [recoveryCodes];
      const index = codesArray.indexOf(code);
      if (index === -1) return false;
      
      // Remove the used code
      codesArray.splice(index, 1);
      this.setDataValue('recoveryCodes', codesArray);
      return true;
    },

    generateToken: function(this: UserInstance): string {
      return this.generateAuthToken();
    }
  };

  // Assign methods to the prototype
  Object.assign(User.prototype, userMethods);

  // Hooks
  User.beforeCreate(async (user: UserInstance) => {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.afterCreate(async (user: UserInstance) => {
    try {
      // Only send verification email if the user is not already verified
      if (!user.isVerified) {
        const token = await emailVerificationService.generateVerificationToken(user.id);
        await emailVerificationService.sendVerificationEmail(user, token);
        console.log(`Verification email sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      // Don't throw the error to prevent user registration from failing
      // Just log it for debugging purposes
    }
  });

  User.beforeUpdate(async (user: UserInstance) => {
    if (user.changed('password') && user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  return User;
};
