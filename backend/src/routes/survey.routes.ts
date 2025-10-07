import express from 'express';
import { Survey, Facility } from '../models';
import { Request, Response } from 'express';

const router = express.Router();

// Get all surveys
router.get('/', async (req: Request, res: Response) => {
  try {
    const surveys = await Survey.findAll({
      include: [{
        model: Facility,
        as: 'facility',
      }],
    });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Create new survey
router.post('/', async (req: Request, res: Response) => {
  try {
    const { facilityId, dailyUsage, peakHours, equipment } = req.body;
    
    // Validate required fields
    if (!facilityId || !dailyUsage || !peakHours || !equipment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const survey = await Survey.create({
      facilityId,
      dailyUsage,
      peakHours,
      equipment,
    });

    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Get survey by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const survey = await Survey.findOne({
      where: { id: req.params.id },
      include: [{
        model: Facility,
        as: 'facility',
      }],
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
});

// Update survey
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const survey = await Survey.findByPk(req.params.id);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    await survey.update(req.body);
    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// Delete survey
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const survey = await Survey.findByPk(req.params.id);

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    await survey.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete survey' });
  }
});

export default router;
