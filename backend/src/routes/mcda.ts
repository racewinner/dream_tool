/**
 * MCDA (Multi-Criteria Decision Analysis) API Routes
 * Handles requests for site comparison using TOPSIS and AHP methods
 */

import { Router, Request, Response } from 'express';
import { 
  performMCDAAnalysis, 
  getAvailableCriteria, 
  MCDARequest, 
  SiteData 
} from '../services/mcdaService';
import { generateComparisonPairs } from '../utils/ahp';
import { authenticate } from '../middleware/auth';
import { Facility, Survey, TechnoEconomicAnalysis } from '../models';

const router = Router();

// Apply authentication middleware to all MCDA routes
router.use(authenticate);

/**
 * GET /api/sites/mcda/criteria
 * Get available criteria for MCDA analysis
 */
router.get('/criteria', async (req: Request, res: Response) => {
  try {
    const criteria = getAvailableCriteria();
    res.json({
      success: true,
      data: criteria
    });
  } catch (error) {
    console.error('Error fetching MCDA criteria:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available criteria',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sites/mcda/comparison-pairs
 * Generate required pairwise comparison pairs for given criteria
 */
router.get('/comparison-pairs', async (req: Request, res: Response) => {
  try {
    const { criteria } = req.query;
    
    if (!criteria) {
      return res.status(400).json({
        success: false,
        message: 'Criteria parameter is required'
      });
    }

    const criteriaArray = Array.isArray(criteria) ? criteria as string[] : (criteria as string).split(',');
    
    if (criteriaArray.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 criteria are required for pairwise comparisons'
      });
    }

    const pairs = generateComparisonPairs(criteriaArray);
    
    res.json({
      success: true,
      data: {
        pairs,
        total_comparisons: pairs.length,
        criteria: criteriaArray
      }
    });
  } catch (error) {
    console.error('Error generating comparison pairs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comparison pairs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/sites/mcda
 * Perform MCDA analysis on selected sites
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const mcdaRequest: MCDARequest = req.body;

    // Validate request structure
    if (!mcdaRequest.selected_sites || !Array.isArray(mcdaRequest.selected_sites)) {
      return res.status(400).json({
        success: false,
        message: 'selected_sites must be an array of facility IDs'
      });
    }

    if (!mcdaRequest.criteria || !Array.isArray(mcdaRequest.criteria)) {
      return res.status(400).json({
        success: false,
        message: 'criteria must be an array of criterion names'
      });
    }

    if (!['TOPSIS_W', 'TOPSIS_AHP'].includes(mcdaRequest.method)) {
      return res.status(400).json({
        success: false,
        message: 'method must be either TOPSIS_W or TOPSIS_AHP'
      });
    }

    // Use imported models

    // Fetch site data for selected facilities
    const sitesData: SiteData[] = [];
    
    for (const facilityId of mcdaRequest.selected_sites) {
      // Get facility
      const facility = await Facility.findByPk(facilityId);
      if (!facility) {
        return res.status(404).json({
          success: false,
          message: `Facility with ID ${facilityId} not found`
        });
      }

      // Get latest survey for facility
      const survey = await Survey.findOne({
        where: { facilityId: facilityId },
        order: [['collectionDate', 'DESC']]
      });
      
      // Get techno-economic analysis for facility
      const technoEconomic = await TechnoEconomicAnalysis.findOne({
        where: { facilityId: facilityId }
      });

      sitesData.push({
        facility,
        survey: survey || undefined,
        technoEconomic: technoEconomic || undefined
      });
    }

    // Perform MCDA analysis
    const result = await performMCDAAnalysis(mcdaRequest, sitesData);

    // Check for validation errors
    if (result.validation_errors && result.validation_errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'MCDA analysis validation failed',
        errors: result.validation_errors,
        data: result
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error performing MCDA analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform MCDA analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/sites/mcda/facilities
 * Get list of facilities available for MCDA analysis
 */
router.get('/facilities', async (req: Request, res: Response) => {
  try {
    // Use imported models

    // Get all facilities with their associated data
    const facilities = await Facility.findAll({
      include: [
        {
          model: Survey,
          as: 'surveys',
          required: false,
          limit: 1,
          order: [['collectionDate', 'DESC']]
        }
      ]
    });

    // Add information about data availability
    const facilitiesWithInfo = await Promise.all(
      facilities.map(async (facility: any) => {
        const hasSurvey = facility.surveys && facility.surveys.length > 0;
        const technoEconomic = await TechnoEconomicAnalysis.findOne({
          where: { facilityId: facility.id }
        });
        const hasTechnoEconomic = !!technoEconomic;

        return {
          id: facility.id,
          name: facility.name,
          type: facility.type,
          latitude: facility.latitude,
          longitude: facility.longitude,
          status: facility.status,
          has_survey: hasSurvey,
          has_techno_economic: hasTechnoEconomic,
          survey_date: hasSurvey ? facility.surveys[0].collectionDate : null
        };
      })
    );

    res.json({
      success: true,
      data: facilitiesWithInfo
    });

  } catch (error) {
    console.error('Error fetching facilities for MCDA:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch facilities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
