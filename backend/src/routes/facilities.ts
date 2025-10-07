import { Router } from 'express';
import { Facility, TechnoEconomicAnalysis } from '../models';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Get all facilities
router.get('/', verifyToken, async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      attributes: ['id', 'name', 'type', 'latitude', 'longitude', 'status'],
      order: [['createdAt', 'DESC']],
    });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching facilities' });
  }
});

// Get a single facility
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id, {
      attributes: ['id', 'name', 'type', 'latitude', 'longitude', 'status'],
      include: [
        {
          model: TechnoEconomicAnalysis,
          attributes: ['id', 'dailyUsage', 'peakHours', 'createdAt'],
        },
      ],
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching facility' });
  }
});

// Create a new facility
router.post('/', verifyToken, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json(facility);
  } catch (error) {
    res.status(400).json({ error: 'Error creating facility' });
  }
});

// Update a facility
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    await facility.update(req.body);
    res.json(facility);
  } catch (error) {
    res.status(400).json({ error: 'Error updating facility' });
  }
});

// Delete a facility
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    await facility.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting facility' });
  }
});

export default router;
