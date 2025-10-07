import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Workflow State Types
export interface WorkflowStep {
  id: string;
  page: 'design' | 'mcda' | 'pv-sites';
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  data?: any;
  completedAt?: Date;
}

export interface WorkflowState {
  id: string;
  type: 'energy_analysis' | 'site_selection' | 'system_deployment';
  title: string;
  description: string;
  currentStepId: string | null;
  steps: WorkflowStep[];
  facilityId?: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface WorkflowContextType {
  workflows: WorkflowState[];
  activeWorkflow: WorkflowState | null;
  startWorkflow: (type: WorkflowState['type'], facilityId?: number) => string;
  updateStepStatus: (workflowId: string, stepId: string, status: WorkflowStep['status'], data?: any) => void;
  setCurrentStep: (workflowId: string, stepId: string) => void;
  completeWorkflow: (workflowId: string) => void;
  getWorkflowProgress: (workflowId: string) => number;
  navigateToStep: (workflowId: string, stepId: string) => void;
}

// Workflow Templates
const WORKFLOW_TEMPLATES = {
  energy_analysis: {
    title: 'Complete Energy Analysis',
    description: 'End-to-end energy system analysis from survey to implementation',
    steps: [
      { id: 'survey_data', page: 'design' as const, title: 'Survey Data Review', status: 'pending' as const },
      { id: 'load_profile', page: 'design' as const, title: 'Load Profile Generation', status: 'pending' as const },
      { id: 'pv_design', page: 'design' as const, title: 'PV System Design', status: 'pending' as const },
      { id: 'techno_economic', page: 'design' as const, title: 'Techno-Economic Analysis', status: 'pending' as const },
      { id: 'mcda_analysis', page: 'mcda' as const, title: 'Multi-Criteria Decision Analysis', status: 'pending' as const },
      { id: 'site_implementation', page: 'pv-sites' as const, title: 'Site Implementation Planning', status: 'pending' as const }
    ]
  },
  site_selection: {
    title: 'Optimal Site Selection',
    description: 'Multi-criteria analysis for selecting optimal PV sites',
    steps: [
      { id: 'site_identification', page: 'mcda' as const, title: 'Site Identification', status: 'pending' as const },
      { id: 'criteria_selection', page: 'mcda' as const, title: 'Criteria Selection', status: 'pending' as const },
      { id: 'mcda_comparison', page: 'mcda' as const, title: 'MCDA Comparison', status: 'pending' as const },
      { id: 'design_validation', page: 'design' as const, title: 'Design Validation', status: 'pending' as const },
      { id: 'site_setup', page: 'pv-sites' as const, title: 'Site Setup', status: 'pending' as const }
    ]
  },
  system_deployment: {
    title: 'System Deployment',
    description: 'Complete system deployment workflow from design to monitoring',
    steps: [
      { id: 'final_design', page: 'design' as const, title: 'Final System Design', status: 'pending' as const },
      { id: 'deployment_planning', page: 'pv-sites' as const, title: 'Deployment Planning', status: 'pending' as const },
      { id: 'system_installation', page: 'pv-sites' as const, title: 'System Installation', status: 'pending' as const },
      { id: 'monitoring_setup', page: 'pv-sites' as const, title: 'Monitoring Setup', status: 'pending' as const }
    ]
  }
};

type WorkflowAction =
  | { type: 'START_WORKFLOW'; payload: { workflowType: WorkflowState['type']; facilityId?: number } }
  | { type: 'UPDATE_STEP_STATUS'; payload: { workflowId: string; stepId: string; status: WorkflowStep['status']; data?: any } }
  | { type: 'SET_CURRENT_STEP'; payload: { workflowId: string; stepId: string } }
  | { type: 'COMPLETE_WORKFLOW'; payload: { workflowId: string } }
  | { type: 'LOAD_WORKFLOWS'; payload: { workflows: WorkflowState[] } };

function workflowReducer(state: WorkflowState[], action: WorkflowAction): WorkflowState[] {
  switch (action.type) {
    case 'START_WORKFLOW': {
      const template = WORKFLOW_TEMPLATES[action.payload.workflowType];
      const newWorkflow: WorkflowState = {
        id: `wf_${Date.now()}`,
        type: action.payload.workflowType,
        title: template.title,
        description: template.description,
        currentStepId: template.steps[0].id,
        steps: template.steps.map(step => ({ ...step })),
        facilityId: action.payload.facilityId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
      
      // Set first step as in_progress
      newWorkflow.steps[0].status = 'in_progress';
      
      return [...state.map(wf => ({ ...wf, isActive: false })), newWorkflow];
    }
    
    case 'UPDATE_STEP_STATUS':
      return state.map(workflow => {
        if (workflow.id !== action.payload.workflowId) return workflow;
        
        return {
          ...workflow,
          steps: workflow.steps.map(step => {
            if (step.id !== action.payload.stepId) return step;
            
            return {
              ...step,
              status: action.payload.status,
              data: action.payload.data || step.data,
              completedAt: action.payload.status === 'completed' ? new Date() : step.completedAt
            };
          }),
          updatedAt: new Date()
        };
      });
    
    case 'SET_CURRENT_STEP':
      return state.map(workflow => {
        if (workflow.id !== action.payload.workflowId) return workflow;
        
        return {
          ...workflow,
          currentStepId: action.payload.stepId,
          updatedAt: new Date()
        };
      });
    
    case 'COMPLETE_WORKFLOW':
      return state.map(workflow => {
        if (workflow.id !== action.payload.workflowId) return workflow;
        
        return {
          ...workflow,
          isActive: false,
          steps: workflow.steps.map(step => ({
            ...step,
            status: step.status === 'pending' ? 'skipped' : step.status,
            completedAt: step.status === 'completed' ? step.completedAt : new Date()
          })),
          updatedAt: new Date()
        };
      });
    
    case 'LOAD_WORKFLOWS':
      return action.payload.workflows;
    
    default:
      return state;
  }
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workflows, dispatch] = useReducer(workflowReducer, []);

  const activeWorkflow = workflows.find(wf => wf.isActive) || null;

  const startWorkflow = (type: WorkflowState['type'], facilityId?: number): string => {
    dispatch({ type: 'START_WORKFLOW', payload: { workflowType: type, facilityId } });
    return `wf_${Date.now()}`;
  };

  const updateStepStatus = (workflowId: string, stepId: string, status: WorkflowStep['status'], data?: any) => {
    dispatch({ type: 'UPDATE_STEP_STATUS', payload: { workflowId, stepId, status, data } });
    
    // Auto-advance to next step if current step is completed
    if (status === 'completed') {
      const workflow = workflows.find(wf => wf.id === workflowId);
      if (workflow) {
        const currentStepIndex = workflow.steps.findIndex(step => step.id === stepId);
        const nextStep = workflow.steps[currentStepIndex + 1];
        if (nextStep && nextStep.status === 'pending') {
          dispatch({ type: 'UPDATE_STEP_STATUS', payload: { workflowId, stepId: nextStep.id, status: 'in_progress' } });
          dispatch({ type: 'SET_CURRENT_STEP', payload: { workflowId, stepId: nextStep.id } });
        }
      }
    }
  };

  const setCurrentStep = (workflowId: string, stepId: string) => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: { workflowId, stepId } });
  };

  const completeWorkflow = (workflowId: string) => {
    dispatch({ type: 'COMPLETE_WORKFLOW', payload: { workflowId } });
  };

  const getWorkflowProgress = (workflowId: string): number => {
    const workflow = workflows.find(wf => wf.id === workflowId);
    if (!workflow) return 0;
    
    const completedSteps = workflow.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / workflow.steps.length) * 100;
  };

  const navigateToStep = (workflowId: string, stepId: string) => {
    const workflow = workflows.find(wf => wf.id === workflowId);
    const step = workflow?.steps.find(s => s.id === stepId);
    
    if (step) {
      setCurrentStep(workflowId, stepId);
      // Navigation logic would be handled by the consuming components
      const targetPage = `/${step.page}`;
      window.history.pushState({}, '', targetPage);
    }
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflows,
        activeWorkflow,
        startWorkflow,
        updateStepStatus,
        setCurrentStep,
        completeWorkflow,
        getWorkflowProgress,
        navigateToStep
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
