import express from 'express';
import { Request, Response } from 'express';
import { sequelize } from '../models';

// Import models from the models index
const { Survey, Facility } = require('../models');

const router = express.Router();

/**
 * Create mock survey data for testing
 * This endpoint will create sample data so you can see imported surveys
 */
router.post('/create-mock-data', async (req: Request, res: Response) => {
  try {
    console.log('🎭 Creating mock survey data...');
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Create mock facilities
      const facilities = await Promise.all([
        Facility.create({
          name: 'Solar Farm Alpha',
          location: 'Northern Region',
          capacity: 100,
          status: 'operational',
          installationDate: new Date('2023-01-15'),
          coordinates: { lat: 1.3521, lng: 103.8198 }
        }, { transaction }),
        
        Facility.create({
          name: 'Solar Farm Beta',
          location: 'Central Region', 
          capacity: 150,
          status: 'operational',
          installationDate: new Date('2023-03-20'),
          coordinates: { lat: 1.3000, lng: 103.8000 }
        }, { transaction }),
        
        Facility.create({
          name: 'Solar Farm Gamma',
          location: 'Southern Region',
          capacity: 200,
          status: 'maintenance',
          installationDate: new Date('2023-06-10'),
          coordinates: { lat: 1.2500, lng: 103.7500 }
        }, { transaction })
      ]);
      
      console.log(`✅ Created ${facilities.length} mock facilities`);
      
      // Create mock surveys
      const surveys = [];
      for (let i = 0; i < 15; i++) {
        const facility = facilities[i % facilities.length];
        const survey = await Survey.create({
          externalId: `mock-survey-${i + 1}`,
          collectionDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 90 days
          respondentId: `respondent-${i + 1}`,
          facilityId: facility.id,
          facilityData: {
            name: facility.name,
            location: facility.location,
            capacity: facility.capacity,
            equipment: [
              {
                type: 'solar_panel',
                count: Math.floor(Math.random() * 50) + 10,
                status: Math.random() > 0.2 ? 'operational' : 'maintenance'
              },
              {
                type: 'inverter',
                count: Math.floor(Math.random() * 5) + 1,
                status: Math.random() > 0.1 ? 'operational' : 'faulty'
              }
            ],
            maintenance: {
              lastService: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              nextService: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
              issues: Math.random() > 0.7 ? ['Panel cleaning needed'] : []
            },
            performance: {
              currentOutput: Math.floor(Math.random() * 80) + 20,
              efficiency: Math.floor(Math.random() * 20) + 80,
              dailyGeneration: Math.floor(Math.random() * 500) + 100
            }
          }
        }, { transaction });
        
        surveys.push(survey);
      }
      
      console.log(`✅ Created ${surveys.length} mock surveys`);
      
      // Commit transaction
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Mock data created successfully',
        data: {
          facilities: facilities.length,
          surveys: surveys.length
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error: any) {
    console.error('❌ Mock data creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mock data',
      error: error.message
    });
  }
});

/**
 * Clear all survey and facility data
 */
router.delete('/clear-data', async (req: Request, res: Response) => {
  try {
    console.log('🗑️ Clearing all survey and facility data...');
    
    const transaction = await sequelize.transaction();
    
    try {
      const deletedSurveys = await Survey.destroy({ where: {}, transaction });
      const deletedFacilities = await Facility.destroy({ where: {}, transaction });
      
      await transaction.commit();
      
      console.log(`✅ Deleted ${deletedSurveys} surveys and ${deletedFacilities} facilities`);
      
      res.json({
        success: true,
        message: 'Data cleared successfully',
        deleted: {
          surveys: deletedSurveys,
          facilities: deletedFacilities
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error: any) {
    console.error('❌ Data clearing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear data',
      error: error.message
    });
  }
});

/**
 * Get current data count
 */
router.get('/data-count', async (req: Request, res: Response) => {
  try {
    const surveyCount = await Survey.count();
    const facilityCount = await Facility.count();
    
    res.json({
      success: true,
      data: {
        surveys: surveyCount,
        facilities: facilityCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Data count failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get data count',
      error: error.message
    });
  }
});

export default router;
