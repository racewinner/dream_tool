import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation middleware for handling validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg,
        value: err.type === 'field' ? err.value : undefined
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for KoboToolbox import
 */
export const validateKoboImport = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date'),
  
  body('source')
    .optional()
    .isIn(['kobo', 'kobotoolbox'])
    .withMessage('source must be "kobo" or "kobotoolbox"'),
  
  // Custom validation for date range
  body().custom((value, { req }) => {
    if (req.body.startDate && req.body.endDate) {
      const start = new Date(req.body.startDate);
      const end = new Date(req.body.endDate);
      
      if (start >= end) {
        throw new Error('startDate must be before endDate');
      }
      
      // Limit to 1 year range to prevent excessive API calls
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > oneYear) {
        throw new Error('Date range cannot exceed 1 year');
      }
    }
    return true;
  }),
  
  handleValidationErrors
];

/**
 * Validation rules for CSV upload
 */
export const validateCsvUpload = [
  body('source')
    .optional()
    .equals('csv')
    .withMessage('source must be "csv"'),
  
  // File validation will be handled by multer middleware
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        details: 'Please select a CSV file to upload'
      });
    }
    
    // Validate file type
    if (!req.file.mimetype.includes('csv') && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        details: 'Only CSV files are supported'
      });
    }
    
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        details: 'File size must be less than 50MB'
      });
    }
    
    next();
  },
  
  handleValidationErrors
];



/**
 * Validation rules for survey ID parameters
 */
export const validateSurveyId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Survey ID must be a positive integer'),
  
  handleValidationErrors
];

/**
 * Validation rules for pagination
 */
export const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),
  
  handleValidationErrors
];

/**
 * Validation rules for external API import
 */
export const validateExternalApiImport = [
  body('apiUrl')
    .notEmpty()
    .withMessage('apiUrl is required')
    .isURL()
    .withMessage('apiUrl must be a valid URL'),
  
  body('apiKey')
    .optional()
    .isString()
    .withMessage('apiKey must be a string'),
  
  body('dataMapping')
    .notEmpty()
    .withMessage('dataMapping is required')
    .isObject()
    .withMessage('dataMapping must be an object'),
  
  body('dataMapping.facilityId')
    .notEmpty()
    .withMessage('dataMapping.facilityId is required'),
  
  body('dataMapping.facilityName')
    .notEmpty()
    .withMessage('dataMapping.facilityName is required'),
  
  body('dataMapping.location')
    .optional()
    .isString()
    .withMessage('dataMapping.location must be a string'),
  
  handleValidationErrors
];

/**
 * Rate limiting validation
 */
export const validateRateLimit = (maxRequests: number = 60, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }
    
    // Get or create client record
    let clientRecord = requests.get(clientId);
    if (!clientRecord || clientRecord.resetTime < windowStart) {
      clientRecord = { count: 0, resetTime: now + windowMs };
      requests.set(clientId, clientRecord);
    }
    
    // Check rate limit
    if (clientRecord.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        details: `Maximum ${maxRequests} requests per minute allowed`,
        retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000)
      });
    }
    
    // Increment counter
    clientRecord.count++;
    
    next();
  };
};

export default {
  handleValidationErrors,
  validateKoboImport,
  validateCsvUpload,
  validateExternalApiImport,
  validateSurveyId,
  validatePagination,
  validateRateLimit
};
