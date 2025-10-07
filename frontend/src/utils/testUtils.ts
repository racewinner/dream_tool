import { Survey, Response, SurveyMetadata, ResponseMetadata, Equipment } from '../types/survey';
import { SurveyService } from '../services/surveyService';

export const createMockSurvey = (): Survey => ({
  id: 'test-survey-1',
  name: 'Test Survey',
  description: 'A test survey for equipment maintenance',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'DRAFT' as const,
  type: 'EQUIPMENT' as const,
  questions: [
    {
      id: 'q1',
      text: 'What is the current status of the generator?',
      type: 'RADIO' as const,
      required: true,
      options: ['Working', 'Needs Maintenance', 'Not Working'],
      order: 1,
      section: 'Generator Status'
    },
    {
      id: 'q2',
      text: 'How many hours was the generator used today?',
      type: 'NUMBER' as const,
      required: true,
      order: 2,
      section: 'Usage'
    }
  ],
  responses: [],
  metadata: {
    facility: {
      name: 'Test Facility',
      type: 'SOLAR_FARM',
      location: {
        address: '123 Test St',
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194
        }
      },
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      }
    },
    equipment: [
      {
        id: 'gen1',
        name: 'Main Generator',
        type: 'POWER' as const,
        category: 'Power Generation',
        powerRating: 1000,
        quantity: 1,
        hoursPerDay: 8,
        hoursPerNight: 0,
        timeOfDay: 'MORNING' as const,
        weeklyUsage: 40,
        critical: true,
        maintenanceSchedule: {
          frequency: 'MONTHLY' as const,
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    ],
    infrastructure: {
      waterAccess: true,
      nationalGrid: true,
      digitalConnectivity: 'WIFI',
      powerSupply: {
        type: 'GRID' as const,
        capacity: 5000,
        reliability: 99.9
      }
    }
  }
});

export const createMockResponse = (surveyId: string): Response => ({
  id: 'test-response-1',
  surveyId,
  respondentId: 'test-respondent-1',
  answers: [
    {
      questionId: 'q1',
      value: 'Working'
    },
    {
      questionId: 'q2',
      value: 8
    }
  ],
  submittedAt: new Date(),
  status: 'COMPLETED' as const,
  metadata: {
    duration: 30,
    device: {
      type: 'MOBILE' as const,
      os: 'iOS',
      browser: 'Safari'
    },
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 5
    },
    network: {
      type: 'WIFI' as const, // Fixed type
      speed: 100
    }
  }
});

export const setupTest = (): SurveyService => {
  const service = new SurveyService();
  return service;
};
