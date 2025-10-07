import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayArrow,
  SkipNext,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { useWorkflow, WorkflowStep } from '../../contexts/WorkflowContext';
import { useNavigate } from 'react-router-dom';

interface WorkflowProgressProps {
  compact?: boolean;
  showNavigation?: boolean;
}

const getStepIcon = (status: WorkflowStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle color="success" />;
    case 'in_progress':
      return <PlayArrow color="primary" />;
    case 'skipped':
      return <SkipNext color="disabled" />;
    default:
      return <RadioButtonUnchecked color="disabled" />;
  }
};

const getStatusColor = (status: WorkflowStep['status']) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'primary';
    case 'skipped':
      return 'default';
    default:
      return 'default';
  }
};

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ 
  compact = false, 
  showNavigation = true 
}) => {
  const { activeWorkflow, getWorkflowProgress, navigateToStep } = useWorkflow();
  const navigate = useNavigate();
  const [expanded, setExpanded] = React.useState(!compact);

  if (!activeWorkflow) {
    return null;
  }

  const progress = getWorkflowProgress(activeWorkflow.id);
  const currentStepIndex = activeWorkflow.steps.findIndex(step => step.id === activeWorkflow.currentStepId);

  const handleStepClick = (step: WorkflowStep) => {
    if (showNavigation && (step.status === 'completed' || step.status === 'in_progress')) {
      navigate(`/${step.page}`, {
        state: {
          workflowId: activeWorkflow.id,
          stepId: step.id,
          fromWorkflow: true
        }
      });
    }
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                {activeWorkflow.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ flex: 1, height: 6, borderRadius: 3 }} 
                />
                <Typography variant="caption" color="textSecondary">
                  {Math.round(progress)}%
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
              sx={{ ml: 2 }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              <Stepper activeStep={currentStepIndex} orientation="horizontal" alternativeLabel>
                {activeWorkflow.steps.map((step, index) => (
                  <Step key={step.id}>
                    <StepLabel
                      icon={getStepIcon(step.status)}
                      onClick={() => handleStepClick(step)}
                      sx={{ 
                        cursor: showNavigation && (step.status === 'completed' || step.status === 'in_progress') 
                          ? 'pointer' : 'default'
                      }}
                    >
                      <Typography variant="caption">
                        {step.title}
                      </Typography>
                      <br />
                      <Chip
                        label={step.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(step.status) as any}
                        variant="outlined"
                      />
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {activeWorkflow.title}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {activeWorkflow.description}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2">Progress:</Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ flex: 1, height: 8, borderRadius: 4 }} 
            />
            <Typography variant="body2" color="textSecondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={currentStepIndex} orientation="vertical">
          {activeWorkflow.steps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel 
                icon={getStepIcon(step.status)}
                onClick={() => handleStepClick(step)}
                sx={{ 
                  cursor: showNavigation && (step.status === 'completed' || step.status === 'in_progress') 
                    ? 'pointer' : 'default'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">
                    {step.title}
                  </Typography>
                  <Chip
                    label={step.status.replace('_', ' ')}
                    size="small"
                    color={getStatusColor(step.status) as any}
                    variant="outlined"
                  />
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  Page: {step.page}
                  {step.completedAt && (
                    <> • Completed: {step.completedAt.toLocaleString()}</>
                  )}
                </Typography>
                {step.data && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Additional data available
                  </Typography>
                )}
                {showNavigation && (step.status === 'completed' || step.status === 'in_progress') && (
                  <Button
                    size="small"
                    onClick={() => handleStepClick(step)}
                    sx={{ mt: 1 }}
                  >
                    Go to Step
                  </Button>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </CardContent>
    </Card>
  );
};

export default WorkflowProgress;
