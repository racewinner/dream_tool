import { Router, Response } from 'express';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth';
import { AuthenticatedRequest, requirePermission } from '../middleware/rolePermissions';

const router = Router();

// Get user profile with enhanced details
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
        createdAt: user.createdAt,
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
      success: true,
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

// Change password
router.put('/password', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating password' });
  }
});

// Toggle 2FA
router.put('/2fa/toggle', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { enabled } = req.body;

    const user = await User.findByPk(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let secret = user.twoFactorSecret;
    
    if (enabled && !secret) {
      // Generate new 2FA secret
      const secretObj = user.generate2FASecret();
      secret = secretObj.secret;
      await user.update({ 
        twoFactorSecret: secret,
        is2faEnabled: false // Will be enabled after verification
      });
      
      res.json({
        success: true,
        secret: secretObj.secret,
        qrCodeUrl: secretObj.otpauthUrl,
        message: 'Scan QR code and verify to complete 2FA setup'
      });
    } else {
      await user.update({ is2faEnabled: enabled });
      res.json({
        success: true,
        is2faEnabled: enabled,
        message: enabled ? '2FA enabled successfully' : '2FA disabled successfully'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating 2FA settings' });
  }
});

// Get user preferences (create default if not exists)
router.get('/preferences', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For now, return default preferences - will be enhanced when UserPreferences model is integrated
    const defaultPreferences = {
      language: 'en',
      timezone: 'Africa/Nairobi',
      dateFormat: 'YYYY-MM-DD',
      unitSystem: 'metric',
      theme: 'system',
      notificationSettings: {
        email: {
          systemAlerts: true,
          maintenanceUpdates: true,
          weeklyReports: false,
          dataImportResults: true,
        },
        inApp: {
          systemAlerts: true,
          maintenanceUpdates: true,
          userMentions: true,
          dataUpdates: true,
        },
      },
      dashboardSettings: {
        defaultWidgets: ['overview', 'recent_activities', 'system_health'],
        refreshInterval: 30000,
        compactMode: false,
      },
      reportSettings: {
        defaultFormat: 'pdf',
        autoSchedule: false,
        includeCharts: true,
      },
    };

    res.json({
      success: true,
      preferences: defaultPreferences,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching preferences' });
  }
});

// Update user preferences
router.put('/preferences', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      language, 
      timezone, 
      dateFormat, 
      unitSystem, 
      theme, 
      notificationSettings,
      dashboardSettings,
      reportSettings 
    } = req.body;

    // For now, just return success - will be enhanced when UserPreferences model is integrated
    const updatedPreferences = {
      language: language || 'en',
      timezone: timezone || 'Africa/Nairobi',
      dateFormat: dateFormat || 'YYYY-MM-DD',
      unitSystem: unitSystem || 'metric',
      theme: theme || 'system',
      notificationSettings: notificationSettings || {},
      dashboardSettings: dashboardSettings || {},
      reportSettings: reportSettings || {},
    };

    res.json({
      success: true,
      preferences: updatedPreferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating preferences' });
  }
});

// Get data usage statistics
router.get('/data-usage', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock data for now - will be enhanced with real database queries
    const dataUsage = {
      totalStorage: '18.6 GB',
      breakdown: [
        { type: 'Survey Data', size: '12.0 GB', lastUpdated: '2024-01-15' },
        { type: 'System Logs', size: '2.3 GB', lastUpdated: '2024-01-18' },
        { type: 'Report Cache', size: '4.3 GB', lastUpdated: '2024-01-17' },
      ],
      retentionSettings: {
        surveyData: 'Permanent',
        systemLogs: '90 days',
        reportCache: '30 days',
      },
    };

    res.json({
      success: true,
      dataUsage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data usage' });
  }
});

// Clean up data (admin only)
router.delete('/data/:type', verifyToken, requirePermission('system_config'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.params;
    
    // Mock cleanup operation
    let cleanedSize = '0 MB';
    switch (type) {
      case 'logs':
        cleanedSize = '1.2 GB';
        break;
      case 'reports':
        cleanedSize = '800 MB';
        break;
      case 'temp':
        cleanedSize = '150 MB';
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedSize} of ${type} data`,
      type,
      cleanedSize,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error cleaning up data' });
  }
});

export default router;
