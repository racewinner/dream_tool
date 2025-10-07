import { Router, Request, Response } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import { SolarSystem, MaintenanceRecord } from '../models';
import { errorHandler } from '../middleware/errorHandler';
import { maintenanceAnalytics } from '../services/maintenanceAnalytics';
import { maintenanceScheduler } from '../services/maintenanceScheduler';
import { SolarSystemRequest, SolarSystemAttributes, MaintenanceRecordRequest, MaintenanceRecordAttributes } from '../types/solarSystem';

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

const router = Router();

// Solar System Routes - Using kebab-case for URLs and consistent parameter naming
router.post('/', verifyToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body as SolarSystemRequest;
    const system = await SolarSystem.create({
      facilityId: data.facilityId,
      systemType: data.systemType,
      capacityKw: data.capacityKw,
      installationDate: new Date(data.installationDate),
      commissioningDate: new Date(data.commissioningDate),
      manufacturer: data.manufacturer,
      model: data.model,
      serialNumber: data.serialNumber,
      warrantyPeriod: data.warrantyPeriod,
      maintenanceSchedule: data.maintenanceSchedule,
      maintenanceFrequency: data.maintenanceFrequency,
      status: 'ACTIVE',
      lastMaintenanceDate: new Date(),
      nextMaintenanceDate: new Date(),
      performanceMetrics: {
        dailyGeneration: 0,
        monthlyGeneration: 0,
        yearlyGeneration: 0,
        efficiency: 0,
        maintenanceCosts: {
          total: 0,
          averagePerKw: 0,
          trend: 'STABLE'
        },
        operationalHours: 0,
        downtime: {
          totalHours: 0,
          percentage: 0,
          frequency: 0
        },
        energyLoss: {
          totalKwh: 0,
          percentage: 0,
          causes: []
        },
        systemAvailability: 0,
        performanceRatio: 0,
        capacityFactor: 0
      },
      fundingSource: data.fundingSource,
      grantAmount: data.grantAmount,
      grantExpiryDate: new Date(data.grantExpiryDate),
      installationCost: data.installationCost,
      maintenanceCost: data.maintenanceCost
    });
    res.status(201).json(system);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const systems = await SolarSystem.findAll({
      where: { facilityId: parseInt(req.query.facilityId as string) },
      order: [['installationDate', 'DESC']]
    });
    res.json(systems);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.get('/:systemId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.systemId, {
      include: ['facility', 'maintenanceRecords']
    });
    if (!system) {
      throw new Error('System not found');
    }
    res.json(system);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.put('/:systemId', verifyToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.systemId);
    if (!system) {
      throw new Error('System not found');
    }
    await system.update(req.body);
    res.json(system);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.delete('/:systemId', verifyToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.systemId);
    if (!system) {
      throw new Error('System not found');
    }
    await system.destroy();
    res.status(204).send();
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// Maintenance Record Routes
router.post('/:systemId/maintenance', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body as MaintenanceRecordRequest;
    const record = await MaintenanceRecord.create({
      solarSystemId: parseInt(req.params.systemId),
      userId: req.user?.id || 0,
      maintenanceDate: new Date(data.maintenanceDate || new Date()),
      maintenanceType: data.maintenanceType,
      maintenanceStatus: 'PENDING',
      maintenanceDescription: data.maintenanceDescription,
      maintenanceCost: data.maintenanceCost,
      partsReplaced: data.partsReplaced || [],
      laborHours: data.laborHours || 0,
      nextMaintenanceDate: new Date(data.nextMaintenanceDate || new Date()),
      maintenanceReport: data.maintenanceReport || '',
      attachments: data.attachments || [],
      preventiveTasks: data.preventiveTasks || [],
      correctiveActions: data.correctiveActions || [],
      systemImpact: data.systemImpact || 'MINOR',
      downtimeHours: data.downtimeHours || 0,
      preventiveMaintenance: data.preventiveMaintenance || false
    });
    res.status(201).json(record);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.get('/:systemId/maintenance', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await MaintenanceRecord.findAll({
      where: { solarSystemId: req.params.systemId },
      order: [['maintenanceDate', 'DESC']]
    });
    res.json(records);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.put('/:systemId/maintenance/:recordId', verifyToken, async (req, res) => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.recordId);
    if (!record) {
      throw new Error('Maintenance record not found');
    }
    await record.update(req.body);
    res.json(record);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.delete('/:systemId/maintenance/:recordId', verifyToken, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const record = await MaintenanceRecord.findByPk(req.params.recordId);
    if (!record) {
      throw new Error('Maintenance record not found');
    }
    await record.destroy();
    res.status(204).send();
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// System Performance Routes
router.get('/:systemId/performance', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.systemId);
    if (!system) {
      throw new Error('System not found');
    }
    
    const metrics = await maintenanceAnalytics.calculateSystemMetrics(parseInt(req.params.id));
    res.json(metrics);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// Maintenance Schedule Routes
router.get('/:id/schedule', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schedule = await maintenanceScheduler.getMaintenanceSchedule();
    res.json(schedule);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

router.post('/:id/schedule/optimize', verifyToken, requireRole(['admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await maintenanceScheduler.optimizeMaintenanceSchedule();
    res.status(200).json({ message: 'Maintenance schedule optimized successfully' });
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// System Status Routes
router.get('/:systemId/status', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = await maintenanceAnalytics.calculateSystemStatus(parseInt(req.params.systemId));
    res.json(status);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// Analytics Routes
router.get('/:id/analytics', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.id);
    if (!system) {
      throw new Error('System not found');
    }

    const analytics = {
      performance: await maintenanceAnalytics.calculateSystemMetrics(parseInt(req.params.id)),
      status: await maintenanceAnalytics.calculateSystemStatus(parseInt(req.params.id)),
      maintenanceHistory: await MaintenanceRecord.findAll({
        where: { solarSystemId: req.params.id },
        order: [['maintenanceDate', 'DESC']],
        limit: 10
      })
    };

    res.json(analytics);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

// Reports Routes
router.get('/:id/reports', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const system = await SolarSystem.findByPk(req.params.id);
    if (!system) {
      throw new Error('System not found');
    }

    const reports = {
      maintenance: await MaintenanceRecord.findAll({
        where: { solarSystemId: req.params.id },
        order: [['maintenanceDate', 'DESC']]
      }),
      performance: await maintenanceAnalytics.calculateSystemMetrics(parseInt(req.params.id)),
      downtime: { totalHours: 0, percentage: 0, frequency: 0 }
    };

    res.json(reports);
  } catch (error) {
    errorHandler.handleError(error as Error, req, res, () => {});
  }
});

export default router;
