import { SurveyService } from '../../services/surveyService';
import { Survey, Question, Response } from '../../types/survey';

export const createMockSurvey = (): Survey => ({
  id: 'test-survey',
  name: 'Test Survey',
  description: 'A test survey',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'DRAFT',
  type: 'FACILITY',
  questions: [
    {
      id: 'q1',
      text: 'Test Question',
      type: 'TEXT',
      required: true,
      order: 1,
      section: 'Test'
    }
  ],
  responses: [],
  metadata: {
    facility: {
      name: 'Test Facility',
      type: 'Test',
      location: {
        address: 'Test Address',
        coordinates: { latitude: 0, longitude: 0 }
      },
      contact: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890'
      }
    },
    equipment: [],
    infrastructure: {
      waterAccess: true,
      nationalGrid: true,
      digitalConnectivity: '4G',
      powerSupply: {
        type: 'GRID',
        capacity: 1000,
        reliability: 99.9
      }
    }
  }
});

export const createMockResponse = (surveyId: string): Response => ({
  id: 'test-response',
  surveyId,
  respondentId: 'test-user',
  answers: [
    {
      questionId: 'q1',
      value: 'Test Answer'
    }
  ],
  submittedAt: new Date(),
  status: 'COMPLETED',
  metadata: {
    duration: 60,
    device: {
      type: 'desktop',
      os: 'Windows',
      browser: 'Chrome'
    },
    location: {
      latitude: 0,
      longitude: 0,
      accuracy: 10
    },
    network: {
      type: '4G',
      speed: 100
    }
  }
});

// This function should be used in test files directly
export const setupTest = () => {
  const service = new SurveyService();
  beforeEach(() => {
    jest.clearAllMocks();
    // We'll mock the service methods directly in test files
  });
  return service;
};
