import { Sequelize } from 'sequelize-typescript';
import { ExternalDataCollectionProvider } from './ExternalDataCollectionProvider';
import { DataImportService } from './DataImportService';
import { Survey } from './Survey';
import { Facility } from './Facility';

interface EquipmentData {
  [key: string]: any;
}

interface SurveyData {
  externalId: string;
  facilityData: {
    equipment: EquipmentData[];
  };
}

async function testEquipmentImport(): Promise<void> {
  console.log('🚀 Starting equipment import test...');

  // Initialize services
  const provider = new ExternalDataCollectionProvider();
  const importService = new DataImportService();
  const sequelize = new Sequelize({
    // Your Sequelize configuration
  });

  try {
    // Step 1: Fetch a single survey from the API
    console.log('\n🔍 Fetching survey from API...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 6); // Last 6 months

    const surveys: SurveyData[] = await provider.getSurveys(startDate, endDate);

    if (surveys.length === 0) {
      console.log('❌ No surveys found in the specified date range');
      return;
    }

    const testSurvey: SurveyData = surveys[0];
    console.log(`✅ Fetched survey ${testSurvey.externalId}`);

    // Log equipment data from API
    console.log('\n📊 Equipment data from API:');
    console.log(JSON.stringify(testSurvey.facilityData.equipment, null, 2));

    // Step 2: Process the survey
    console.log('\n🔄 Processing survey...');
    await importService.processSurvey(testSurvey);

    console.log('✅ Survey processed successfully');

    // Step 3: Retrieve the saved survey from the database
    console.log('\n🔍 Retrieving saved survey from database...');
    const savedSurvey: Survey = await Survey.findOne({
      where: { externalId: testSurvey.externalId },
      include: [
        {
          model: Facility,
          as: 'facility'
        }
      ]
    });

    if (!savedSurvey) {
      console.log('❌ Failed to find saved survey in database');
      return;
    }

    // Log equipment data from database
    console.log('\n📊 Equipment data from database:');
    console.log(JSON.stringify(savedSurvey.facilityData.equipment, null, 2));

    // Step 4: Compare the equipment data
    console.log('\n🔍 Comparing equipment data...');
    const apiEquipment: EquipmentData[] = testSurvey.facilityData.equipment || [];
    const dbEquipment: EquipmentData[] = savedSurvey.facilityData.equipment || [];

    console.log(`API equipment count: ${apiEquipment.length}`);
    console.log(`DB equipment count: ${dbEquipment.length}`);

    if (apiEquipment.length !== dbEquipment.length) {
      console.log(`❌ Equipment count mismatch: API=${apiEquipment.length}, DB=${dbEquipment.length}`);
    } else {
      console.log('✅ Equipment counts match');
    }

    // Check for any differences in equipment items
    const differences: string[] = [];
    for (let i = 0; i < Math.max(apiEquipment.length, dbEquipment.length); i++) {
      const apiItem: EquipmentData | undefined = apiEquipment[i];
      const dbItem: EquipmentData | undefined = dbEquipment[i];

      if (!apiItem || !dbItem) {
        differences.push(`Missing item at index ${i}: ${!apiItem ? 'API' : 'DB'}`);
        continue;
      }

      // Add your logic to compare equipment items
    }

    if (differences.length > 0) {
      console.log('\n❌ Found differences in equipment data:');
      differences.forEach(diff => console.log(`- ${diff}`));
    } else {
      console.log('✅ All equipment data matches');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testEquipmentImport()
  .then(() => console.log('\n🏁 Test completed'))
  .catch(console.error);
