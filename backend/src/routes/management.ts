import { Router, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '../models';
import { verifyToken } from '../middleware/auth';
import { AuthenticatedRequest, requireRole, requirePermission } from '../middleware/rolePermissions';

const router = Router();

// Get system overview (all roles can access)
router.get('/overview', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock system overview data matching frontend expectations
    const systemData = {
      totalUsers: 45,
      activeUsers: 38,
      totalFacilities: 128,
      systemHealth: 'healthy' as const,
      lastBackup: new Date().toISOString(),
      diskUsage: 23,
    };

    res.json(systemData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching system overview' });
  }
});

// User management routes (admin only)
router.get('/users', verifyToken, requirePermission('user_management'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'is2faEnabled', 'createdAt'],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      users: users.rows,
      pagination: {
        total: users.count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(users.count / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', verifyToken, requirePermission('user_management'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'technical_expert', 'technical_junior', 'non_technical'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (user.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user role' });
  }
});

// Get system configuration (admin only)
router.get('/system-config', verifyToken, requirePermission('system_config'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock system configuration data
    const systemConfig = {
      general: {
        applicationName: 'DREAM TOOL',
        version: '1.0.0',
        maintenanceMode: false,
        maxFileUploadSize: '50MB',
        sessionTimeout: 30,
      },
      security: {
        passwordMinLength: 6,
        require2FA: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
      },
      notifications: {
        emailEnabled: true,
        whatsappEnabled: true,
        smsEnabled: false,
        defaultLanguage: 'en',
      },
      dataRetention: {
        surveyData: 'permanent',
        systemLogs: 90,
        reportCache: 30,
        userSessions: 7,
      },
    };

    res.json({
      success: true,
      config: systemConfig,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching system configuration' });
  }
});

// Update system configuration (admin only)
router.put('/system-config', verifyToken, requirePermission('system_config'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { general, security, notifications, dataRetention } = req.body;

    // Mock configuration update
    const updatedConfig = {
      general: general || {},
      security: security || {},
      notifications: notifications || {},
      dataRetention: dataRetention || {},
      lastModified: new Date().toISOString(),
      modifiedBy: req.user!.email,
    };

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating system configuration' });
  }
});

// Get system health metrics (technical users and admin)
router.get('/system-health', verifyToken, requireRole('admin', 'technical_expert', 'technical_junior'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock system health data
    const systemHealth = {
      status: 'healthy',
      uptime: '15 days, 8 hours',
      cpu: { usage: 45, status: 'normal' },
      memory: { usage: 68, total: '16GB', available: '5.1GB', status: 'normal' },
      database: { 
        connectionPool: { active: 8, idle: 12, total: 20 },
        queryPerformance: { avgResponseTime: '12ms', slowQueries: 2 },
        status: 'healthy'
      },
      storage: { used: '18.6GB', total: '500GB', usage: 3.7, status: 'normal' },
      services: [
        { name: 'API Server', status: 'running', port: 3001 },
        { name: 'Database', status: 'running', port: 5432 },
        { name: 'Redis Cache', status: 'running', port: 6379 },
        { name: 'WhatsApp Service', status: 'running', port: 3002 },
      ],
      errors: {
        last24h: 3,
        last7d: 15,
        criticalErrors: 0,
      },
    };

    res.json({
      success: true,
      health: systemHealth,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching system health' });
  }
});

// Get system logs (admin and technical expert only)
router.get('/logs', verifyToken, requireRole('admin', 'technical_expert'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { level = 'all', page = 1, limit = 50, from, to } = req.query;

    // Mock log data
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'User authentication successful',
        source: 'auth-service',
        userId: req.user!.id,
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'warning',
        message: 'High memory usage detected',
        source: 'system-monitor',
        details: { memoryUsage: '75%' },
      },
      {
        timestamp: new Date(Date.now() - 600000).toISOString(),
        level: 'error',
        message: 'Failed to connect to external API',
        source: 'kobo-service',
        error: 'Connection timeout',
      },
    ];

    const filteredLogs = level === 'all' ? logs : logs.filter(log => log.level === level);

    res.json({
      success: true,
      logs: filteredLogs,
      pagination: {
        total: filteredLogs.length,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching system logs' });
  }
});

// Get methodology configurations (technical users only)
router.get('/methodologies', verifyToken, requireRole('admin', 'technical_expert', 'technical_junior'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Mock methodology configuration data
    const methodologies = {
      solarCalculations: {
        panelEfficiency: 0.20,
        temperatureCoefficient: -0.004,
        systemLosses: 0.15,
        peakSunHours: 5.5,
        degradationRate: 0.008,
      },
      economicAnalysis: {
        discountRate: 0.08,
        inflationRate: 0.05,
        projectLifetime: 25,
        currency: 'USD',
        taxRate: 0.16,
      },
      batteryCalculations: {
        depthOfDischarge: 0.8,
        roundtripEfficiency: 0.95,
        cycleLife: 5000,
        autonomyDays: 2,
      },
      mcda: {
        weights: {
          cost: 0.3,
          technical: 0.25,
          environmental: 0.2,
          social: 0.15,
          financial: 0.1,
        },
        normalizationMethod: 'min-max',
        aggregationMethod: 'weighted-sum',
      },
    };

    res.json({
      success: true,
      methodologies,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching methodologies' });
  }
});

// Update methodology configurations (technical expert and admin only)
router.put('/methodologies', verifyToken, requirePermission('modify_methodologies'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { solarCalculations, economicAnalysis, batteryCalculations, mcda } = req.body;

    // Mock methodology update
    const updatedMethodologies = {
      solarCalculations: solarCalculations || {},
      economicAnalysis: economicAnalysis || {},
      batteryCalculations: batteryCalculations || {},
      mcda: mcda || {},
      lastModified: new Date().toISOString(),
      modifiedBy: req.user!.email,
    };

    res.json({
      success: true,
      message: 'Methodology configurations updated successfully',
      methodologies: updatedMethodologies,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating methodologies' });
  }
});

export default router;
