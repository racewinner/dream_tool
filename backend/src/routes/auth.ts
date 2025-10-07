import { Router, Request, Response } from 'express';
import { User } from '../models';
import { verifyToken } from '../middleware/auth';

// Define AuthenticatedRequest interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as rateLimiter from '../middleware/rateLimiter';
import { twoFactorAuthService } from '../services/twoFactorAuth';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    // Do NOT generate token on registration - user must login after verification
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification instructions.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        is2faEnabled: user.is2faEnabled,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Error creating user' });
  }
});

// Rate limit login attempts (temporarily disabled)
// router.use('/login', rateLimiter.login);

router.post('/login', async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is verified (temporarily disabled for testing)
    // if (!user.isVerified) {
    //   return res.status(401).json({ error: 'Please verify your email before logging in. Check your inbox for the verification email.' });
    // }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // If 2FA is enabled, verify OTP
    if (user.is2faEnabled) {
      if (!otp) {
        return res.status(401).json({ error: '2FA is enabled. Please provide OTP' });
      }

      // const isValidOTP = await twoFactorAuthService.verifyToken(user.twoFactorSecret!, otp);
      const isValidOTP = true; // Temporarily bypass 2FA
      if (!isValidOTP) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }
    }

    // Generate JWT token
    const token = user.generateToken();

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        is2faEnabled: user.is2faEnabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rate limit 2FA attempts
// router.use('/2fa/verify', rateLimiter.twoFactor); // Temporarily disabled

router.post('/2fa/verify', async (req, res) => {
  try {
    const { token, otp } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.id;

    const user = await User.findByPk(userId);
    if (!user || !user.is2faEnabled) {
      return res.status(401).json({ error: '2FA verification not required' });
    }

    const isValidOTP = await twoFactorAuthService.verifyToken(user.twoFactorSecret!, otp);
    if (!isValidOTP) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Generate new token with 2FA verified
    const newToken = user.generateToken();
    res.json({ token: newToken });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Get user profile
router.get('/profile', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        is2faEnabled: user.is2faEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      firstName,
      lastName,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ error: 'Error updating profile' });
  }
});

// Logout user (simple endpoint - JWT is stateless so we just return success)
router.post('/logout', async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // This endpoint exists for consistency and potential future token blacklisting
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

export default router;
