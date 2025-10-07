import express from 'express';
import { Request, Response } from 'express';
import { SiteData, PortfolioData } from '../types/site';
import { TechnoEconomicAssessment } from '../utils/techno-economic';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get portfolio data for all sites
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    
    // TODO: Replace with actual database query
    const sites: SiteData[] = [
      {
        id: 'site1',
        name: 'Site 1',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'San Francisco, CA'
        },
        energyData: {
          dailyUsage: 5000,
          peakHours: 8,
          equipment: [
            { name: 'Production Line 1', power: 1000, hours: 8, efficiency: 0.9, critical: true },
            { name: 'Production Line 2', power: 800, hours: 8, efficiency: 0.85, critical: true },
            { name: 'Lighting', power: 200, hours: 16, efficiency: 0.95, critical: false }
          ],
          solarPanelEfficiency: 0.18,
          batteryEfficiency: 0.9,
          gridAvailability: 0.95
        }
      },
      {
        id: 'site2',
        name: 'Site 2',
        location: {
          latitude: 34.0522,
          longitude: -118.2437,
          address: 'Los Angeles, CA'
        },
        energyData: {
          dailyUsage: 7000,
          peakHours: 10,
          equipment: [
            { name: 'Production Line 1', power: 1500, hours: 10, efficiency: 0.9, critical: true },
            { name: 'Production Line 2', power: 1200, hours: 10, efficiency: 0.85, critical: true },
            { name: 'Lighting', power: 300, hours: 16, efficiency: 0.95, critical: false },
            { name: 'HVAC', power: 500, hours: 24, efficiency: 0.8, critical: true }
          ],
          solarPanelEfficiency: 0.18,
          batteryEfficiency: 0.9,
          gridAvailability: 0.9
        }
      }
    ];

    const portfolio: PortfolioData = {
      sites,
      portfolioAnalysis: {
        totalEnergyProduction: 0,
        totalDieselConsumption: 0,
        totalCO2Reduction: 0,
        totalCO2Emissions: 0,
        totalWaterSaved: 0,
        totalLandRequired: 0,
        totalMaintenanceWaste: 0,
        averageSystemEfficiency: 0,
        portfolioNPV: 0,
        portfolioIRR: 0,
        costSavings: 0,
        paybackPeriod: 0
      }
    };

    // Calculate analysis for each site
    for (const site of sites) {
      const assessment = new TechnoEconomicAssessment(site.energyData);
      const results = assessment.calculate();
      
      // Update portfolio metrics
      portfolio.portfolioAnalysis.totalEnergyProduction += results.pv.energyProduction.yearly;
      portfolio.portfolioAnalysis.totalDieselConsumption += results.diesel.fuelConsumption.yearly;
      portfolio.portfolioAnalysis.totalCO2Reduction += results.pv.environmentalImpact.co2Reduction;
      portfolio.portfolioAnalysis.totalCO2Emissions += results.diesel.environmentalImpact.co2Emissions;
      portfolio.portfolioAnalysis.totalWaterSaved += results.pv.environmentalImpact.waterSaved;
      portfolio.portfolioAnalysis.totalLandRequired += results.pv.environmentalImpact.landRequired;
      portfolio.portfolioAnalysis.totalMaintenanceWaste += results.diesel.environmentalImpact.maintenanceWaste;
      
      // Add site analysis results
      site.analysis = {
        pv: results.pv,
        diesel: results.diesel
      };
    }

    // Calculate portfolio-wide metrics
    portfolio.portfolioAnalysis.averageSystemEfficiency = portfolio.sites.reduce(
      (sum, site) => sum + (site.analysis.pv.energyProduction.yearly / 
        (site.analysis.pv.energyProduction.yearly + site.analysis.diesel.fuelConsumption.yearly)),
      0
    ) / portfolio.sites.length;

    portfolio.portfolioAnalysis.costSavings = portfolio.portfolioAnalysis.totalDieselConsumption * 1.5 -
      portfolio.portfolioAnalysis.totalEnergyProduction * 0.1;

    portfolio.portfolioAnalysis.paybackPeriod = portfolio.sites.reduce(
      (sum, site) => sum + site.analysis.pv.financial.initialCost + site.analysis.diesel.financial.initialCost,
      0
    ) / (portfolio.portfolioAnalysis.totalEnergyProduction * 0.1);

    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

// Add new site to portfolio
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { siteData } = req.body;

    // TODO: Validate site data
    // TODO: Save to database
    
    res.status(201).json({ message: 'Site added successfully' });
  } catch (error) {
    console.error('Error adding site:', error);
    res.status(500).json({ error: 'Failed to add site' });
  }
});

// Update site data
router.put('/:siteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { siteId } = req.params;
    const { siteData } = req.body;

    // TODO: Validate site data
    // TODO: Update in database
    
    res.json({ message: 'Site updated successfully' });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

// Delete site from portfolio
router.delete('/:siteId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { siteId } = req.params;

    // TODO: Delete from database
    
    res.json({ message: 'Site removed successfully' });
  } catch (error) {
    console.error('Error removing site:', error);
    res.status(500).json({ error: 'Failed to remove site' });
  }
});

export default router;
