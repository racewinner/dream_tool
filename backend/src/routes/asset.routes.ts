import express from 'express';
import { Asset, Facility, Maintenance, SolarSystem } from '../models';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get all assets
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const assets = await Asset.findAll({
      include: [
        {
          model: Facility,
          as: 'facility',
        },
        // Note: Maintenance is linked to SolarSystems, not Assets directly
        // We'll skip this association for now until the data model is clarified
        // {
        //   model: Maintenance,
        //   as: 'maintenances',
        //   order: [['date', 'DESC']],
        // },
      ],
    });
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Get asset by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Facility,
          as: 'facility',
        },
        // Note: Maintenance is linked to SolarSystems, not Assets directly
        // We'll skip this association for now until the data model is clarified
        // {
        //   model: Maintenance,
        //   as: 'maintenances',
        //   order: [['date', 'DESC']],
        // },
      ],
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

// Create new asset
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { facilityId, pvCapacity, batteryCapacity, inverterType, installationDate } = req.body;

    // Validate required fields
    if (!facilityId || !pvCapacity || !batteryCapacity || !inverterType || !installationDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const asset = await Asset.create({
      facilityId,
      pvCapacity,
      batteryCapacity,
      inverterType,
      installationDate,
      status: 'active',
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// Update asset
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await asset.update(req.body);
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await asset.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Add maintenance log
router.post('/:id/maintenance', authenticate, async (req: Request, res: Response) => {
  try {
    const { issue, resolution, technician } = req.body;
    const assetId = req.params.id;

    // Validate required fields
    if (!issue || !resolution || !technician) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const solarSystem = await SolarSystem.findOne({ where: { assetId } });
    if (!solarSystem) {
      return res.status(404).json({ error: 'Solar system not found' });
    }

    const maintenance = await Maintenance.create({
      solarSystemId: solarSystem.id,
      issue,
      resolution,
      technician,
      date: new Date(),
    });

    // Update asset's last maintenance date
    await Asset.update(
      { lastMaintenance: new Date(), nextMaintenance: calculateNextMaintenanceDate() },
      { where: { id: assetId } }
    );

    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add maintenance log' });
  }
});

// Get maintenance history
router.get('/:id/maintenance', authenticate, async (req: Request, res: Response) => {
  try {
    const solarSystem = await SolarSystem.findOne({ where: { assetId: req.params.id } });
    if (!solarSystem) {
      return res.status(404).json({ error: 'Solar system not found' });
    }

    const maintenances = await Maintenance.findAll({
      where: { solarSystemId: solarSystem.id },
      order: [['date', 'DESC']],
    });
    res.json(maintenances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance history' });
  }
});

// Helper function to calculate next maintenance date
function calculateNextMaintenanceDate(): Date {
  const now = new Date();
  now.setMonth(now.getMonth() + 6); // Next maintenance in 6 months
  return now;
}

export default router;
