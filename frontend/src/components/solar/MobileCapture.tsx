import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Grid
} from '@mui/material';
import {
  PhotoCamera,
  Check,
  Close,
  ArrowBack,
  ArrowForward,
  Lightbulb,
  BatteryFull,
  ElectricalServices,
  Settings,
  Info,
  Refresh,
  CameraAlt,
  FlipCameraAndroid,
  BrightnessHigh,
  BrightnessLow,
  CropFree
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { solarAnalysisService } from '../../services/solarAnalysisService';
import { offlineQueueService, useOfflineSync } from '../../services/offlineQueueService';

interface CaptureStep {
  component_type: string;
  title: string;
  instructions: string;
  icon: React.ReactNode;
  example_image?: string;
  quality_checks: string[];
  tips: string[];
}

const MobileCapture: React.FC = () => {
  const { facilityId, assessmentId } = useParams<{ facilityId: string, assessmentId: string }>();
  const navigate = useNavigate();
  const { syncStatus, isOnline } = useOfflineSync();
  
  const [activeStep, setActiveStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState<Record<string, Blob>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Define capture steps
  const captureSteps: CaptureStep[] = [
    {
      component_type: 'solar_panel',
      title: 'Solar Panel Array',
      instructions: 'Capture the entire solar panel array from a distance that shows all panels',
      icon: <Lightbulb />,
      example_image: '/images/examples/solar_panel_example.jpg',
      quality_checks: ['brightness', 'angle', 'all_panels_visible'],
      tips: [
        'Stand back 10-15 feet to capture the entire array',
        'Avoid shadows on the panels',
        'Try to capture from a front-facing angle',
        'Make sure all panels are visible in the frame'
      ]
    },
    {
      component_type: 'solar_panel_closeup',
      title: 'Solar Panel Label',
      instructions: 'Take a close-up of the panel label or specification plate',
      icon: <Lightbulb />,
      example_image: '/images/examples/solar_panel_label_example.jpg',
      quality_checks: ['focus', 'text_visible', 'no_glare'],
      tips: [
        'Get as close as possible to the label',
        'Ensure text is clearly visible and in focus',
        'Avoid glare by adjusting your angle',
        'Make sure the entire label is in frame'
      ]
    },
    {
      component_type: 'battery',
      title: 'Battery Bank',
      instructions: 'Capture the entire battery bank showing all batteries',
      icon: <BatteryFull />,
      example_image: '/images/examples/battery_bank_example.jpg',
      quality_checks: ['all_batteries_visible', 'connections_visible'],
      tips: [
        'Capture all batteries in the bank',
        'Make sure terminals and connections are visible',
        'Include any visible battery management system',
        'Try to capture the arrangement of batteries (series/parallel)'
      ]
    },
    {
      component_type: 'battery_label',
      title: 'Battery Label',
      instructions: 'Take a close-up of the battery label or specification plate',
      icon: <BatteryFull />,
      example_image: '/images/examples/battery_label_example.jpg',
      quality_checks: ['focus', 'text_visible', 'no_glare'],
      tips: [
        'Get close to the label',
        'Ensure voltage and capacity information is visible',
        'Make sure text is in focus',
        'Capture manufacturer information if available'
      ]
    },
    {
      component_type: 'inverter',
      title: 'Inverter',
      instructions: 'Capture the entire inverter including any display panel',
      icon: <ElectricalServices />,
      example_image: '/images/examples/inverter_example.jpg',
      quality_checks: ['full_inverter_visible', 'display_readable'],
      tips: [
        'Capture the entire inverter unit',
        'Make sure any display screen is visible',
        'Include surrounding area to show ventilation',
        'Capture any visible wiring connections'
      ]
    },
    {
      component_type: 'inverter_label',
      title: 'Inverter Label',
      instructions: 'Take a close-up of the inverter label or specification plate',
      icon: <ElectricalServices />,
      example_image: '/images/examples/inverter_label_example.jpg',
      quality_checks: ['focus', 'text_visible', 'no_glare'],
      tips: [
        'Get close to the label',
        'Ensure power rating information is visible',
        'Make sure text is in focus',
        'Capture model number and manufacturer information'
      ]
    },
    {
      component_type: 'mppt',
      title: 'MPPT Controller',
      instructions: 'Capture the entire MPPT controller including any display',
      icon: <Settings />,
      example_image: '/images/examples/mppt_example.jpg',
      quality_checks: ['full_controller_visible', 'display_readable'],
      tips: [
        'Capture the entire controller unit',
        'Make sure any display screen is visible',
        'Include any visible wiring connections',
        'Try to capture any indicator lights'
      ]
    },
    {
      component_type: 'mppt_label',
      title: 'MPPT Label',
      instructions: 'Take a close-up of the MPPT controller label or specification plate',
      icon: <Settings />,
      example_image: '/images/examples/mppt_label_example.jpg',
      quality_checks: ['focus', 'text_visible', 'no_glare'],
      tips: [
        'Get close to the label',
        'Ensure current and voltage ratings are visible',
        'Make sure text is in focus',
        'Capture model number and manufacturer information'
      ]
    }
  ];
  
  // Initialize camera
  const initializeCamera = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: { 
          facingMode: useFrontCamera ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
      
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setCameraActive(false);
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };
  
  // Toggle camera
  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      initializeCamera();
    }
  };
  
  // Switch camera
  const switchCamera = () => {
    setUseFrontCamera(!useFrontCamera);
    if (cameraActive) {
      stopCamera();
      setTimeout(() => {
        initializeCamera();
      }, 300);
    }
  };
  
  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob(blob => {
        if (blob) {
          const currentStep = captureSteps[activeStep];
          
          // Store blob
          setCapturedImages(prev => ({
            ...prev,
            [currentStep.component_type]: blob
          }));
          
          // Create preview URL
          const url = URL.createObjectURL(blob);
          setPreviewUrls(prev => ({
            ...prev,
            [currentStep.component_type]: url
          }));
          
          // Stop camera
          stopCamera();
          
          // Perform quality checks
          checkImageQuality(blob, currentStep.quality_checks);
        }
      }, 'image/jpeg', 0.9);
    }
  };
  
  // Check image quality
  const checkImageQuality = async (blob: Blob, checks: string[]) => {
    // This would ideally use AI to check image quality
    // For now, we'll just simulate some basic checks
    
    // Create a new array for issues
    const issues: string[] = [];
    
    // Create an image element to analyze
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    
    await new Promise(resolve => {
      img.onload = resolve;
    });
    
    // Simple brightness check (very basic)
    if (checks.includes('brightness')) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        
        brightness = brightness / (data.length / 4);
        
        if (brightness < 50) {
          issues.push('Image appears too dark. Try taking the photo in better lighting.');
        } else if (brightness > 200) {
          issues.push('Image appears too bright. Try reducing exposure or avoiding direct sunlight.');
        }
      }
    }
    
    // Image size check
    if (blob.size < 100000) { // Less than 100KB
      issues.push('Image resolution appears too low. Try getting closer to the subject.');
    }
    
    // Set quality issues
    setQualityIssues(issues);
  };
  
  // Retake photo
  const retakePhoto = () => {
    const currentStep = captureSteps[activeStep];
    
    // Remove stored image
    setCapturedImages(prev => {
      const updated = { ...prev };
      delete updated[currentStep.component_type];
      return updated;
    });
    
    // Remove preview URL
    setPreviewUrls(prev => {
      const updated = { ...prev };
      delete updated[currentStep.component_type];
      return updated;
    });
    
    // Clear quality issues
    setQualityIssues([]);
    
    // Start camera
    initializeCamera();
  };
  
  // Handle next step
  const handleNext = () => {
    if (activeStep < captureSteps.length - 1) {
      setActiveStep(activeStep + 1);
      setQualityIssues([]);
      
      // Check if we already have an image for the next step
      const nextStep = captureSteps[activeStep + 1];
      if (!previewUrls[nextStep.component_type]) {
        // Start camera for next step
        initializeCamera();
      }
    } else {
      // Last step, submit all photos
      handleSubmitPhotos();
    }
  };
  
  // Handle back
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setQualityIssues([]);
      
      // Check if we already have an image for the previous step
      const prevStep = captureSteps[activeStep - 1];
      if (!previewUrls[prevStep.component_type]) {
        // Start camera for previous step
        initializeCamera();
      }
    }
  };
  
  // Submit all photos
  const handleSubmitPhotos = async () => {
    if (!assessmentId) {
      setError('Assessment ID is missing');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Group component types
      const componentGroups = {
        solar_panel: ['solar_panel', 'solar_panel_closeup'],
        battery: ['battery', 'battery_label'],
        inverter: ['inverter', 'inverter_label'],
        mppt: ['mppt', 'mppt_label']
      };
      
      // Upload each component group
      for (const [componentType, photoTypes] of Object.entries(componentGroups)) {
        // Check if we have at least one photo for this component
        const hasPhoto = photoTypes.some(type => capturedImages[type]);
        
        if (hasPhoto) {
          // Use the main photo for the component
          const mainPhotoType = photoTypes[0];
          const mainPhoto = capturedImages[mainPhotoType];
          
          if (mainPhoto) {
            // Create file from blob
            const file = new File([mainPhoto], `${componentType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            if (isOnline) {
              // Upload directly if online
              await solarAnalysisService.uploadComponentPhoto(assessmentId, componentType, file);
            } else {
              // Queue for later if offline
              await offlineQueueService.queueComponentPhoto(assessmentId, componentType, file);
            }
          }
        }
      }
      
      setSuccess('All photos have been successfully submitted!');
      
      // Navigate back to assessment details
      setTimeout(() => {
        navigate(`/facilities/${facilityId}/solar/assessments/${assessmentId}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting photos:', err);
      setError('Failed to submit photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop camera and release resources
      stopCamera();
      
      // Revoke object URLs
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);
  
  // Initialize camera when step changes
  useEffect(() => {
    const currentStep = captureSteps[activeStep];
    if (!previewUrls[currentStep.component_type] && !cameraActive) {
      initializeCamera();
    }
  }, [activeStep]);
  
  const currentStep = captureSteps[activeStep];
  const hasCurrentImage = !!previewUrls[currentStep.component_type];
  
  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2 }, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#f5f5f5'
    }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(`/facilities/${facilityId}/solar/assessments/${assessmentId}`)}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" component="h1">
              Capture Solar Components
            </Typography>
          </Box>
          
          {!isOnline && (
            <Chip 
              label={`Offline Mode (${syncStatus.pendingItems} pending)`}
              color="warning"
              size="small"
            />
          )}
        </Box>
      </Paper>
      
      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 2, display: { xs: 'none', sm: 'block' } }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {captureSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel 
                icon={step.icon}
                optional={<Typography variant="caption">{step.title}</Typography>}
              />
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      {/* Mobile step indicator */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, justifyContent: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Step {activeStep + 1} of {captureSteps.length}
        </Typography>
      </Box>
      
      {/* Main content */}
      <Paper sx={{ p: 2, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Step title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 1 }}>{currentStep.icon}</Box>
          <Typography variant="h6">{currentStep.title}</Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Instructions */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {currentStep.instructions}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button 
              size="small" 
              startIcon={<Info />}
              onClick={() => setShowTips(true)}
            >
              Tips
            </Button>
            
            {currentStep.example_image && (
              <Button 
                size="small" 
                onClick={() => setShowExample(true)}
              >
                View Example
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Camera view or preview */}
        <Box sx={{ 
          position: 'relative', 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          bgcolor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
          minHeight: 300
        }}>
          {cameraActive && (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                maxHeight: '70vh'
              }}
            />
          )}
          
          {hasCurrentImage && (
            <img 
              src={previewUrls[currentStep.component_type]} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                maxHeight: '70vh'
              }}
            />
          )}
          
          {!cameraActive && !hasCurrentImage && (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <CameraAlt sx={{ fontSize: 60, color: '#555', mb: 2 }} />
              <Typography variant="body1" color="#fff">
                Camera is not active
              </Typography>
              <Button 
                variant="contained" 
                onClick={initializeCamera}
                sx={{ mt: 2 }}
              >
                Start Camera
              </Button>
            </Box>
          )}
          
          {/* Camera controls overlay */}
          {cameraActive && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 16, 
              left: 0, 
              right: 0, 
              display: 'flex', 
              justifyContent: 'center',
              gap: 2
            }}>
              <IconButton 
                onClick={switchCamera}
                sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              >
                <FlipCameraAndroid />
              </IconButton>
              
              <IconButton 
                onClick={capturePhoto}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.8)', 
                  color: '#000',
                  width: 64,
                  height: 64
                }}
              >
                <CameraAlt sx={{ fontSize: 32 }} />
              </IconButton>
              
              <IconButton 
                onClick={stopCamera}
                sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}
              >
                <Close />
              </IconButton>
            </Box>
          )}
          
          {/* Frame guide overlay */}
          {cameraActive && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: 1,
              margin: 3,
              pointerEvents: 'none'
            }} />
          )}
        </Box>
        
        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Quality issues */}
        {qualityIssues.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Potential quality issues:</Typography>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              {qualityIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
            <Typography variant="body2">
              You can still continue, but consider retaking the photo for better analysis.
            </Typography>
          </Alert>
        )}
        
        {/* Preview controls */}
        {hasCurrentImage && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={retakePhoto}
              sx={{ mr: 1 }}
            >
              Retake Photo
            </Button>
            
            <Button 
              variant="contained" 
              endIcon={<Check />}
              color="success"
              onClick={handleNext}
            >
              {activeStep < captureSteps.length - 1 ? 'Next' : 'Submit All Photos'}
            </Button>
          </Box>
        )}
        
        {/* Error and success messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
      
      {/* Navigation buttons */}
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        
        <Box>
          {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
          
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!hasCurrentImage || loading}
            endIcon={activeStep < captureSteps.length - 1 ? <ArrowForward /> : <Check />}
          >
            {activeStep < captureSteps.length - 1 ? 'Next' : 'Submit All Photos'}
          </Button>
        </Box>
      </Paper>
      
      {/* Tips dialog */}
      <Dialog open={showTips} onClose={() => setShowTips(false)}>
        <DialogTitle>
          Tips for {currentStep.title}
        </DialogTitle>
        <DialogContent>
          <List>
            {currentStep.tips.map((tip, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body1">• {tip}</Typography>
              </Box>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTips(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Example image dialog */}
      <Dialog open={showExample} onClose={() => setShowExample(false)}>
        <DialogTitle>
          Example: {currentStep.title}
        </DialogTitle>
        <DialogContent>
          {currentStep.example_image && (
            <img 
              src={currentStep.example_image} 
              alt="Example" 
              style={{ 
                width: '100%', 
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Try to capture your photo similar to this example for best results.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExample(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileCapture;
