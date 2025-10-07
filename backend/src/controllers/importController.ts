import { Request, Response } from 'express';
import { ImportService } from '../services/importService';
import { ImportJob } from '../types/importJob';

// Define interface for requests that have been authenticated
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export class ImportController {
  private importService: ImportService;

  constructor(importService: ImportService) {
    this.importService = importService;
    this.importFromKobo = this.importFromKobo.bind(this);
    this.getImportStatus = this.getImportStatus.bind(this);
    this.listImports = this.listImports.bind(this);
    this.retryImport = this.retryImport.bind(this);
  }

  /**
   * Import data from KoboToolbox
   */
  async importFromKobo(req: AuthenticatedRequest, res: Response) {
    try {
      const { data } = req.body;
      const userId = req.user?.id; // Assuming you have user authentication middleware
      
      if (!data) {
        return res.status(400).json({ error: 'No data provided' });
      }

      const importRecord = await this.importService.queueImport('kobo', data, userId);
      
      // Process the import in the background
      this.importService.processPendingImports(1)
        .catch(error => {
          console.error('Background import failed:', error);
        });

      return res.status(202).json({
        message: 'Import started',
        importId: importRecord.id,
        status: 'pending'
      });
    } catch (error) {
      console.error('Import error:', error);
      return res.status(500).json({
        error: 'Failed to import data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get import status
   */
  async getImportStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const rawImport = await this.importService.getImportStatus(id);
      
      if (!rawImport) {
        return res.status(404).json({ error: 'Import not found' });
      }

      // Transform the raw import to the frontend ImportJob structure
      const importJob: ImportJob = await this.importService.toImportJob(rawImport);

      return res.json({
        success: true,
        data: importJob
      });
    } catch (error) {
      console.error('Error getting import status:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get import status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * List all imports with optional filtering
   */
  async listImports(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, source, limit = '50', offset = '0' } = req.query;
      const page = Math.floor(parseInt(offset as string, 10) / parseInt(limit as string, 10)) + 1;
      
      const result = await this.importService.listImports({
        status: status as string,
        source: source as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      });

      // Transform raw imports to ImportJob format for frontend
      const paginatedResponse = await this.importService.toImportJobsList(
        result.rows,
        result.count,
        page,
        parseInt(limit as string, 10)
      );

      return res.json({
        success: true,
        ...paginatedResponse
      });
    } catch (error) {
      console.error('Error listing imports:', error);
      return res.status(500).json({ 
        error: 'Failed to list imports',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Retry a failed import
   */
  async retryImport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // Assuming you have user authentication middleware
      
      const result = await this.importService.retryImport(id);
      
      return res.json({
        message: 'Import retry started',
        importId: id,
        status: 'pending'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'Import not found') {
        return res.status(404).json({ error: errorMessage });
      }
      if (errorMessage === 'Only failed imports can be retried') {
        return res.status(400).json({ error: errorMessage });
      }
      
      console.error('Retry import error:', error);
      return res.status(500).json({ 
        error: 'Failed to retry import',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new ImportController(new ImportService());
