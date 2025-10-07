// Simplified Survey model test
const { expect } = require('chai');
const { Sequelize, DataTypes } = require('sequelize');

console.log('Starting simplified survey test...');

// Create an in-memory SQLite database
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false, // Disable logging for cleaner output
  retry: {
    max: 5,
    timeout: 60000
  }
});

// Define a simplified Facility model
const Facility = sequelize.define('Facility', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'Facilities',
  timestamps: true
});

// Define a simplified Survey model
const Survey = sequelize.define('Survey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  facilityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Facilities',
      key: 'id'
    }
  },
  facilityData: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  collectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  respondentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'Surveys',
  timestamps: true
});

// Set up associations
Survey.belongsTo(Facility, { foreignKey: 'facilityId' });
Facility.hasMany(Survey, { foreignKey: 'facilityId' });

describe('Simplified Survey Model', function() {
  // Increase timeout for all tests in this suite
  this.timeout(30000);

  before(async function() {
    console.log('Setting up test database...');
    
    try {
      // Sync all models
      await sequelize.sync({ force: true });
      console.log('Database synced successfully');
      
      // Create a test facility
      const facility = await Facility.create({
        id: 1,
        name: 'Test Facility'
      });
      console.log('Created test facility:', facility.toJSON());
      
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });

  after(async function() {
    console.log('Cleaning up...');
    await sequelize.close();
  });

  describe('Basic Operations', function() {
    it('should create a new survey', async function() {
      console.log('Running test: should create a new survey');
      
      const testData = {
        externalId: 'test-survey-1',
        facilityId: 1,
        facilityData: {
          name: 'Test Facility',
          type: 'Health Center',
          status: 'active'
        },
        collectionDate: new Date(),
        respondentId: 'test-respondent-1'
      };
      
      try {
        const survey = await Survey.create(testData);
        console.log('Created survey:', survey.toJSON());
        
        expect(survey).to.have.property('id');
        expect(survey.externalId).to.equal(testData.externalId);
        expect(survey.facilityId).to.equal(testData.facilityId);
        expect(survey.respondentId).to.equal(testData.respondentId);
        
      } catch (error) {
        console.error('Error creating survey:', error);
        throw error;
      }
    });
  });
});
