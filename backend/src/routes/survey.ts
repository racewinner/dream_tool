import { Router, Request, Response } from 'express';
import { Survey, SurveyVersion, Equipment } from '../models';
import { verifyToken } from '../middleware/auth';

// Define authenticated request interface
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

const router = Router();

// Get all surveys for a facility
router.get('/:facilityId', verifyToken, async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const surveys = await Survey.findAll({
      where: { facilityId },
      include: [
        {
          model: SurveyVersion,
          as: 'versions',
          order: [['version', 'DESC']],
        },
        {
          model: Equipment,
          as: 'equipment',
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(surveys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch surveys' });
  }
});

// Create new survey
router.post('/:facilityId', verifyToken, async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const { facilityData, equipment } = req.body;

    // Validate required fields
    const requiredFields = ['productiveSectors', 'operationalHours', 'infrastructure'];
    const missingFields = requiredFields.filter(field => !facilityData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Create survey
    const survey = await Survey.create({
      facilityId,
      facilityData,
    });

    // Create initial version
    await SurveyVersion.create({
      surveyId: survey.id,
      version: 1,
      status: 'draft',
      createdBy: (req as AuthenticatedRequest).user.username,
    });

    // Create equipment entries
    if (equipment && Array.isArray(equipment)) {
      await Equipment.bulkCreate(
        equipment.map(item => ({
          ...item,
          surveyId: survey.id,
        }))
      );
    }

    res.status(201).json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey' });
  }
});

// Update survey
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const { facilityData, equipment } = req.body;

    // Get existing survey
    const survey = await Survey.findByPk(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Create new version
    const latestVersion = await SurveyVersion.findOne({
      where: { surveyId },
      order: [['version', 'DESC']],
    });

    await SurveyVersion.create({
      surveyId,
      version: latestVersion.version + 1,
      status: 'draft',
      createdBy: (req as AuthenticatedRequest).user.username,
      notes: 'Updated survey data',
    });

    // Update survey data
    await survey.update({ facilityData });

    // Update equipment
    if (equipment && Array.isArray(equipment)) {
      await Equipment.destroy({ where: { surveyId } });
      await Equipment.bulkCreate(
        equipment.map(item => ({
          ...item,
          surveyId,
        }))
      );
    }

    res.json(survey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update survey' });
  }
});

// Get survey analysis
router.get('/:id/analysis', verifyToken, async (req, res) => {
  try {
    const surveyId = req.params.id;
    const survey = await Survey.findByPk(surveyId, {
      include: [
        {
          model: Equipment,
          as: 'equipment',
        },
      ],
    });

    if (!survey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    // Calculate daily usage
    const calculateDailyUsage = (equipment: any[]) => {
      return equipment.reduce((total: number, item) => {
        const { powerRating, quantity, hoursPerDay, hoursPerNight, weeklyUsage, timeOfDay } = item;
        const weeklyDays = 7;
        const availabilityFactor = weeklyUsage / weeklyDays;
        
        const dailyEnergy = (
          (hoursPerDay + hoursPerNight) * 
          powerRating * 
          quantity * 
          availabilityFactor
        ) / 1000;

        let timeOfDayFactor = 1.0;
        if (timeOfDay === 'evening') {
          timeOfDayFactor = 1.2;
        } else if (timeOfDay === 'night') {
          timeOfDayFactor = 0.8;
        }

        return total + (dailyEnergy * timeOfDayFactor);
      }, 0);
    };

    const dailyUsage = calculateDailyUsage(survey.equipment);

    // Calculate peak hours
    const { operationalHours } = survey.facilityData;
    const peakHours = Math.max(
      operationalHours.day,
      operationalHours.night
    ) * 0.85;

    res.json({
      dailyUsage,
      peakHours,
      equipment: survey.equipment,
      facilityData: survey.facilityData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze survey' });
  }
});

export default router;
