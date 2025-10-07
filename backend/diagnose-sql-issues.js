const { sequelize } = require('./dist/models');
const { DataImportService } = require('./dist/services/dataImportService');

console.log('🔍 Diagnosing SQL issues in survey import...');

async function diagnoseSQLIssues() {
  try {
    // Test database connection
    console.log('\n🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check existing surveys
    console.log('\n📊 Checking existing surveys...');
    const existingSurveys = await sequelize.models.Survey.findAll({
      attributes: ['id', 'externalId', 'facilityId'],
      limit: 10
    });
    console.log(`Found ${existingSurveys.length} existing surveys:`);
    existingSurveys.forEach(survey => {
      console.log(`  - ID: ${survey.id}, External ID: ${survey.externalId}, Facility ID: ${survey.facilityId}`);
    });

    // Check existing facilities
    console.log('\n🏥 Checking existing facilities...');
    const existingFacilities = await sequelize.models.Facility.findAll({
      attributes: ['id', 'name', 'type'],
      limit: 10
    });
    console.log(`Found ${existingFacilities.length} existing facilities:`);
    existingFacilities.forEach(facility => {
      console.log(`  - ID: ${facility.id}, Name: ${facility.name}, Type: ${facility.type}`);
    });

    // Test a single survey import with detailed error capture
    console.log('\n🧪 Testing single survey import...');
    const importService = new DataImportService();
    
    // Get survey data from KoboToolbox
    console.log('📡 Fetching survey data from KoboToolbox...');
    const provider = importService.provider;
    const surveys = await provider.getSurveys();
    
    if (surveys.length === 0) {
      console.log('❌ No surveys found from KoboToolbox');
      return;
    }

    console.log(`📋 Found ${surveys.length} surveys from KoboToolbox`);
    const firstSurvey = surveys[0];
    console.log('🔍 First survey structure:');
    console.log('  - Keys:', Object.keys(firstSurvey));
    console.log('  - ID:', firstSurvey.id || firstSurvey._id);
    console.log('  - Submission time:', firstSurvey._submission_time);

    // Try to process just the first survey with detailed logging
    console.log('\n🔄 Processing first survey with detailed logging...');
    
    // Start a transaction to test the exact SQL operations
    await sequelize.transaction(async (transaction) => {
      try {
        // Transform survey data
        console.log('🔄 Transforming survey data...');
        const transformedData = importService.transformSurveyData(firstSurvey);
        console.log('✅ Survey transformed:', {
          externalId: transformedData.externalId,
          facilityDataKeys: Object.keys(transformedData.facilityData || {}),
          collectionDate: transformedData.collectionDate
        });

        // Check if survey already exists
        console.log('🔍 Checking for existing survey...');
        const existing = await sequelize.models.Survey.findOne({
          where: { externalId: transformedData.externalId },
          transaction
        });

        if (existing) {
          console.log('ℹ️ Survey already exists:', existing.id);
          throw new Error('ROLLBACK_TEST'); // Rollback to avoid changes
        }

        // Try to create/get facility
        console.log('🏥 Creating/getting facility...');
        const facilityName = transformedData?.rawData?.responses?.facility_name || 'Test Facility';
        console.log('  - Facility name:', facilityName);

        let facility = await sequelize.models.Facility.findOne({
          where: { name: facilityName },
          transaction
        });

        if (!facility) {
          console.log('🔨 Creating new facility...');
          facility = await sequelize.models.Facility.create({
            name: facilityName,
            type: 'healthcare',
            latitude: 0,
            longitude: 0,
            status: 'survey'
          }, { transaction });
          console.log('✅ Facility created:', facility.id);
        } else {
          console.log('✅ Using existing facility:', facility.id);
        }

        // Try to create survey
        console.log('📝 Creating survey record...');
        const surveyData = {
          externalId: transformedData.externalId,
          facilityId: facility.id,
          facilityData: transformedData.facilityData,
          collectionDate: transformedData.collectionDate,
          respondentId: transformedData.respondentId
        };

        console.log('📊 Survey data to insert:', {
          externalId: surveyData.externalId,
          facilityId: surveyData.facilityId,
          facilityDataType: typeof surveyData.facilityData,
          facilityDataKeys: Object.keys(surveyData.facilityData || {}),
          collectionDate: surveyData.collectionDate,
          respondentId: surveyData.respondentId
        });

        const createdSurvey = await sequelize.models.Survey.create(surveyData, { transaction });
        console.log('✅ Survey created successfully:', createdSurvey.id);

        // Rollback to avoid actual changes
        throw new Error('ROLLBACK_TEST');

      } catch (error) {
        if (error.message === 'ROLLBACK_TEST') {
          console.log('🔄 Rolling back test transaction (expected)');
          return;
        }

        console.error('\n❌ SQL ERROR DETECTED:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.sql) {
          console.error('SQL Query:', error.sql);
        }
        if (error.parameters) {
          console.error('SQL Parameters:', error.parameters);
        }
        if (error.original) {
          console.error('Original error:', error.original);
        }
        if (error.constraint) {
          console.error('Constraint:', error.constraint);
        }
        if (error.table) {
          console.error('Table:', error.table);
        }
        if (error.column) {
          console.error('Column:', error.column);
        }
        if (error.detail) {
          console.error('Detail:', error.detail);
        }
        if (error.code) {
          console.error('Error code:', error.code);
        }

        throw error; // Re-throw to trigger rollback
      }
    });

  } catch (error) {
    if (error.message !== 'ROLLBACK_TEST') {
      console.error('\n💥 Diagnostic failed:', error.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
  }
}

diagnoseSQLIssues().then(() => {
  console.log('\n✅ SQL diagnostic completed');
}).catch(error => {
  console.error('\n💥 Diagnostic error:', error.message);
});
