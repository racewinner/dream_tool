import { Router, Request } from 'express';
import { User } from '../models';
import { emailVerificationService } from '../services/emailVerification';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Send verification email
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    const token = await emailVerificationService.generateVerificationToken(user.id);
    await emailVerificationService.sendVerificationEmail(user, token);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Verify email
// GET endpoint for email verification link
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const userId = await emailVerificationService.verifyToken(token);

    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await User.update(
      { isVerified: true },
      { where: { id: userId } }
    );

    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify email' 
    });
  }
});

// POST endpoint for email verification from frontend
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const userId = await emailVerificationService.verifyToken(token);

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired verification token' 
      });
    }

    await User.update(
      { isVerified: true },
      { where: { id: userId } }
    );

    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Failed to verify email' 
    });
  }
});

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Get verification status
router.get('/status', verifyToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if req.user exists before accessing its properties
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ isVerified: user.isVerified });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

export default router;
