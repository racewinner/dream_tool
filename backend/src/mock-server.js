// Minimal mock backend server to bypass database issues
// This will serve the frontend immediately while we resolve database connectivity

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for frontend with detailed configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'Pragma',
    'If-Modified-Since',
    'X-Requested-With',
    'X-Auth-Token'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Authorization'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS with the above options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add CORS headers manually for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

console.log('🚀 Starting minimal mock backend server...');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Mock backend running' });
});

// Mock survey data for dashboard
app.get('/api/mock-data/surveys', (req, res) => {
  console.log('📊 Serving mock survey data...');
  
  const mockSurveys = [
    {
      id: 1,
      facility_id: 1,
      survey_date: '2024-01-15',
      facility_data: {
        name: 'Solar Farm Alpha',
        location: 'Northern Region',
        capacity: '500kW',
        status: 'operational'
      },
      responses: {
        energy_production: '450kWh',
        maintenance_status: 'good',
        equipment_condition: 'excellent',
        staff_count: 3
      },
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      facility_id: 2,
      survey_date: '2024-01-20',
      facility_data: {
        name: 'Solar Farm Beta',
        location: 'Southern Region',
        capacity: '750kW',
        status: 'operational'
      },
      responses: {
        energy_production: '680kWh',
        maintenance_status: 'excellent',
        equipment_condition: 'good',
        staff_count: 5
      },
      created_at: '2024-01-20T14:30:00Z'
    },
    {
      id: 3,
      facility_id: 3,
      survey_date: '2024-01-25',
      facility_data: {
        name: 'Solar Farm Gamma',
        location: 'Eastern Region',
        capacity: '300kW',
        status: 'maintenance'
      },
      responses: {
        energy_production: '200kWh',
        maintenance_status: 'needs_attention',
        equipment_condition: 'fair',
        staff_count: 2
      },
      created_at: '2024-01-25T09:15:00Z'
    }
  ];

  res.json(mockSurveys);
});

// Mock survey analysis endpoint
app.get('/api/survey-analysis', (req, res) => {
  console.log('📈 Serving mock survey analysis...');
  
  const mockAnalysis = {
    completeness: {
      total_surveys: 3,
      complete_surveys: 2,
      incomplete_surveys: 1,
      completion_rate: 66.7
    },
    facility_distribution: [
      { name: 'Northern Region', count: 1 },
      { name: 'Southern Region', count: 1 },
      { name: 'Eastern Region', count: 1 }
    ],
    data_timeline: [
      { date: '2024-01-15', count: 1 },
      { date: '2024-01-20', count: 1 },
      { date: '2024-01-25', count: 1 }
    ],
    quality_metrics: {
      high_quality: 2,
      medium_quality: 1,
      low_quality: 0
    }
  };

  res.json(mockAnalysis);
});

// Frontend dashboard endpoint (this is what the frontend actually calls)
app.get('/api/dashboard/surveys', (req, res) => {
  console.log('📊 Serving dashboard surveys data...');
  
  const mockSurveys = [
    {
      id: 1,
      facility_id: 1,
      survey_date: '2024-01-15',
      facility_data: {
        name: 'Solar Farm Alpha',
        location: 'Northern Region',
        capacity: '500kW',
        status: 'operational'
      },
      responses: {
        energy_production: '450kWh',
        maintenance_status: 'good',
        equipment_condition: 'excellent',
        staff_count: 3
      },
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      facility_id: 2,
      survey_date: '2024-01-20',
      facility_data: {
        name: 'Solar Farm Beta',
        location: 'Southern Region',
        capacity: '750kW',
        status: 'operational'
      },
      responses: {
        energy_production: '680kWh',
        maintenance_status: 'excellent',
        equipment_condition: 'good',
        staff_count: 5
      },
      created_at: '2024-01-20T14:30:00Z'
    },
    {
      id: 3,
      facility_id: 3,
      survey_date: '2024-01-25',
      facility_data: {
        name: 'Solar Farm Gamma',
        location: 'Eastern Region',
        capacity: '300kW',
        status: 'maintenance'
      },
      responses: {
        energy_production: '200kWh',
        maintenance_status: 'needs_attention',
        equipment_condition: 'fair',
        staff_count: 2
      },
      created_at: '2024-01-25T09:15:00Z'
    }
  ];

  res.json(mockSurveys);
});

// Visualization service endpoint
app.get('/api/visualizations/surveys', (req, res) => {
  console.log('📈 Serving visualization surveys data...');
  
  // Data formatted for chart components (ChartDataPoint format)
  const mockVisualizationData = {
    // Raw data for reference
    completeness: {
      total_surveys: 3,
      complete_surveys: 2,
      incomplete_surveys: 1,
      completion_rate: 66.7
    },
    facility_distribution: [
      { name: 'Northern Region', count: 1 },
      { name: 'Southern Region', count: 1 },
      { name: 'Eastern Region', count: 1 }
    ],
    data_timeline: [
      { date: '2024-01-15', count: 1 },
      { date: '2024-01-20', count: 1 },
      { date: '2024-01-25', count: 1 }
    ],
    quality_metrics: {
      high_quality: 2,
      medium_quality: 1,
      low_quality: 0
    },
    
    // Chart-ready data in ChartDataPoint format
    completenessChart: [
      { label: 'Complete', value: 2 },
      { label: 'Incomplete', value: 1 }
    ],
    qualityChart: [
      { label: 'High Quality', value: 2 },
      { label: 'Medium Quality', value: 1 },
      { label: 'Low Quality', value: 0 }
    ],
    facilityDistributionChart: [
      { label: 'Northern Region', value: 1 },
      { label: 'Southern Region', value: 1 },
      { label: 'Eastern Region', value: 1 }
    ],
    dateDistributionChart: [
      { date: '2024-01-15', value: 1 },
      { date: '2024-01-20', value: 1 },
      { date: '2024-01-25', value: 1 }
    ],
    repeatGroupsChart: [],
    missingFieldsChart: [
      { label: 'Complete Fields', value: 85 },
      { label: 'Missing Fields', value: 15 }
    ],
    geoDistributionChart: [
      { latitude: 35.6762, longitude: 139.6503, label: 'Northern Region', value: 1 },
      { latitude: 34.0522, longitude: -118.2437, label: 'Southern Region', value: 1 },
      { latitude: 40.7128, longitude: -74.0060, label: 'Eastern Region', value: 1 }
    ],
    
    surveys: [
      {
        id: 1,
        facility_name: 'Solar Farm Alpha',
        location: 'Northern Region',
        survey_date: '2024-01-15',
        completion_status: 'complete',
        quality_score: 95
      },
      {
        id: 2,
        facility_name: 'Solar Farm Beta',
        location: 'Southern Region',
        survey_date: '2024-01-20',
        completion_status: 'complete',
        quality_score: 88
      },
      {
        id: 3,
        facility_name: 'Solar Farm Gamma',
        location: 'Eastern Region',
        survey_date: '2024-01-25',
        completion_status: 'incomplete',
        quality_score: 72
      }
    ]
  };

  // Return data in the format the frontend expects
  res.json({
    success: true,
    data: mockVisualizationData
  });
});

// Mock import endpoints
app.post('/api/import/kobo/surveys', (req, res) => {
  console.log('📥 Mock import request received');
  res.json({ 
    success: true, 
    message: 'Mock import successful',
    imported_count: 3
  });
});

app.get('/api/import/status', (req, res) => {
  res.json({ 
    status: 'idle',
    message: 'Mock backend ready for import'
  });
});

// Catch-all for other API routes
app.use('/api/*', (req, res) => {
  console.log(`🔍 Mock API called: ${req.method} ${req.path}`);
  res.json({ 
    message: 'Mock endpoint', 
    method: req.method, 
    path: req.path,
    note: 'This is a temporary mock response while database is being configured'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Mock backend server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Mock surveys: http://localhost:${PORT}/api/mock-data/surveys`);
  console.log(`📈 Mock analysis: http://localhost:${PORT}/api/survey-analysis`);
  console.log('');
  console.log('🎉 Frontend can now connect and display mock data!');
  console.log('💡 This bypasses the database connection issue temporarily.');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down mock backend server...');
  process.exit(0);
});
