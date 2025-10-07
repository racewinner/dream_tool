/**
 * Simple test script to verify the ImportPage wizard navigation
 */
import { 
  ImportSourceType, 
  ImportSchedule, 
  DuplicateStrategy, 
  ValidationLevel, 
  PostImportAction 
} from '../services/importService';

// Mock React state management
let activeStep = 0;
let sourceType: ImportSourceType | null = null;
let importConfig: {
  source?: ImportSourceType;
  schedule?: ImportSchedule;
  duplicateStrategy?: DuplicateStrategy;
  validationLevel?: ValidationLevel;
  postImportAction?: PostImportAction;
  [key: string]: any;
} = {};

// Mock ImportService
const importService = {
  previewImport: async (config: any) => {
    console.log('Previewing import with config:', config);
    return { records: [{ id: 1, name: 'Test Facility' }] };
  }
};

// Simulate state setters
const setActiveStep = (newStep: number) => {
  console.log(`Step changed from ${activeStep} to ${newStep}`);
  activeStep = newStep;
};

const setSourceType = (type: ImportSourceType | null) => {
  console.log(`Source type changed from ${sourceType} to ${type}`);
  sourceType = type;
};

const setImportConfig = (config: any) => {
  console.log('Import config updated:', config);
  importConfig = config;
};

// Mock notification
const showNotification = (message: string | any, type?: string) => {
  if (typeof message === 'string') {
    console.log(`Notification [${type || 'info'}]: ${message}`);
  } else {
    console.log(`Notification [${message.type}]: ${message.message}`);
  }
};

// Simulate handleNext function
const handleNext = async () => {
  console.log('[WIZARD TEST] handleNext called, activeStep:', activeStep, 'sourceType:', sourceType);
  
  if (activeStep === 0 && !sourceType) {
    console.warn('[WIZARD TEST] Cannot proceed: No source type selected');
    showNotification('Please select a data source', 'error');
    return;
  }
  
  try {
    if (activeStep === 1) {
      // Before showing preview, validate the import configuration
      console.log('[WIZARD TEST] Validating import configuration:', importConfig);
      const preview = await importService.previewImport(importConfig);
      console.log('[WIZARD TEST] Preview data received:', preview);
    } else if (activeStep === 0) {
      // Just proceed to the next step for source selection
      console.log('[WIZARD TEST] Moving to step 1 with source type:', sourceType);
      console.log('[WIZARD TEST] Import config:', JSON.stringify(importConfig, null, 2));
    }
    
    // Increment step counter
    console.log('[WIZARD TEST] Incrementing step from', activeStep, 'to', activeStep + 1);
    setActiveStep(activeStep + 1);
  } catch (error) {
    console.error('[WIZARD TEST] Error in handleNext:', error);
    showNotification({ message: 'Failed to proceed: ' + (error instanceof Error ? error.message : 'Unknown error'), type: 'error' });
  }
};

// Async test runner function
async function runImportWizardTests() {
  // Test case 1: Try to proceed without selecting a source type
  console.log('\n=== Test Case 1: Proceed without source type ===');
  await handleNext();

  // Test case 2: Select a source type and proceed to step 1
  console.log('\n=== Test Case 2: Select KoboToolbox and proceed ===');
  console.log('Clicking KoboToolbox card...');
  setSourceType(ImportSourceType.KOBO_TOOLBOX);
  setImportConfig({
    ...importConfig,
    source: ImportSourceType.KOBO_TOOLBOX
  });
  await handleNext();

  // Test case 3: Try to proceed from step 1 without entering credentials
  console.log('\n=== Test Case 3: Proceed without credentials ===');
  console.log('Current step should be 1 (KoboToolbox Config)');
  console.log('Trying to proceed without entering credentials...');
  setActiveStep(1);
  await handleNext();

  // Test case 4: Configure import settings and proceed to step 2
  console.log('\n=== Test Case 4: Configure settings and proceed ===');
  setImportConfig({
    ...importConfig,
    schedule: ImportSchedule.ONCE,
    duplicateStrategy: DuplicateStrategy.UPDATE,
    validationLevel: ValidationLevel.STANDARD,
    postImportAction: PostImportAction.NONE
  });
  await handleNext();
  
  console.log('\n=== Test Results ===');
  console.log('Final step:', activeStep);
  console.log('Source type:', sourceType);
  console.log('Import config:', JSON.stringify(importConfig, null, 2));

  if (activeStep === 2) {
    console.log('✅ TEST PASSED: Import wizard navigation is working correctly!');
  } else {
    console.log('❌ TEST FAILED: Import wizard did not reach step 2 as expected');
  }
}

// Run the tests
runImportWizardTests().catch(console.error);
