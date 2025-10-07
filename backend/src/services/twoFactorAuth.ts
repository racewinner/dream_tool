import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { User as UserModel } from '../models';
import { UserInstance, UserAttributes } from '../models/user'; // Fixed casing to match actual file path
import dotenv from 'dotenv';

dotenv.config();

export interface TwoFactorAuthSecret {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export class TwoFactorAuthService {
  private static instance: TwoFactorAuthService;

  private constructor() {}

  public static getInstance(): TwoFactorAuthService {
    if (!TwoFactorAuthService.instance) {
      TwoFactorAuthService.instance = new TwoFactorAuthService();
    }
    return TwoFactorAuthService.instance;
  }

  async generateSecret(userId: number): Promise<TwoFactorAuthSecret> {
    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME || 'DREAM TOOL'} (${userId})`,
      length: 20,
    });

    const otpauthUrl = secret.otpauth_url;
    if (!otpauthUrl) {
      throw new Error('Failed to generate OTP auth URL');
    }
    
    const qrCode = await qrcode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      qrCode,
      otpauthUrl,
    };
  }

  async verifyToken(secret: string, token: string): Promise<boolean> {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });
  }

  async generateRecoveryCodes(): Promise<string[]> {
    const recoveryCodes = [];
    for (let i = 0; i < 10; i++) {
      recoveryCodes.push(speakeasy.generateSecret({ length: 16 }).base32);
    }
    return recoveryCodes;
  }

  async validateRecoveryCode(user: UserInstance, code: string): Promise<boolean> {
    if (!user.recoveryCodes) return false;
    
    // In the UserAttributes interface, recoveryCodes is defined as string[] | null
    // But in practice, it might be stored as a comma-separated string in the database
    // Handle both possibilities explicitly with type assertions
    let codesArray: string[] = [];
    
    if (Array.isArray(user.recoveryCodes)) {
      codesArray = user.recoveryCodes;
    } else {
      // Use type assertion to tell TypeScript that recoveryCodes can be safely treated as string
      const recoveryCodesStr = user.recoveryCodes as unknown as string;
      codesArray = recoveryCodesStr ? recoveryCodesStr.split(',') : [];
    }
    const isValid = codesArray.includes(code);

    if (isValid) {
      // Remove used recovery code
      const newCodes = codesArray.filter((c: string) => c !== code);
      // Ensure we store recovery codes as a comma-separated string
      const recoveryCodesStr = Array.isArray(newCodes) ? newCodes.join(',') : '';
      
      await UserModel.update(
        { recoveryCodes: recoveryCodesStr },
        { where: { id: user.id } }
      );
    }

    return isValid;
  }
}

export const twoFactorAuthService = TwoFactorAuthService.getInstance();
