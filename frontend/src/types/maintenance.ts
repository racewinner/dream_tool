export interface PartsInventory {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string;
  stockQuantity: number;
  reorderLevel: number;
  leadTime: number;
  unitCost: number;
  supplier: string;
  lastUpdated: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  leadTime: number;
  reliability: number;
  parts: string[];
}

export interface WorkOrder {
  id: string;
  type: 'ROUTINE' | 'CORRECTIVE' | 'PREVENTIVE' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo: string;
  scheduledDate: Date;
  completionDate: Date;
  description: string;
  partsRequired: PartsInventory[];
  laborHours: number;
  cost: number;
  notes: string[];
}

export interface PreventiveMaintenance {
  id: string;
  systemId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  tasks: MaintenanceTask[];
  lastPerformed: Date;
  nextDue: Date;
  status: 'SCHEDULED' | 'OVERDUE' | 'COMPLETED';
}

export interface MaintenanceTask {
  id: string;
  description: string;
  frequency: string;
  duration: number;
  requiredSkills: string[];
  partsRequired: PartsInventory[];
  toolsRequired: string[];
}

export interface MaintenanceSchedule {
  id: string;
  systemId: string;
  startDate: Date;
  endDate: Date;
  frequency: string;
  tasks: MaintenanceTask[];
  resources: Resource[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface Resource {
  id: string;
  type: 'PERSONNEL' | 'EQUIPMENT' | 'PARTS';
  name: string;
  availability: number;
  costPerHour: number;
  skills: string[];
}

export interface MaintenanceLog {
  id: string;
  workOrderId: string;
  systemId: string;
  performedBy: string;
  date: Date;
  duration: number;
  partsUsed: PartsInventory[];
  laborHours: number;
  cost: number;
  notes: string;
}

export interface MaintenanceMetrics {
  totalCost: number;
  downtimeHours: number;
  meanTimeBetweenFailures: number;
  meanTimeToRepair: number;
  systemAvailability: number;
  partsUsage: PartsInventory[];
  laborHours: number;
  completionRate: number;
  overdueTasks: number;
}

export interface MaintenanceAlert {
  id: string;
  type: 'PARTS_LOW' | 'TASK_OVERDUE' | 'SYSTEM_ALERT' | 'COST_ALERT';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  systemId: string;
  workOrderId: string;
  timestamp: Date;
  status: 'ACTIVE' | 'RESOLVED' | 'IGNORED';
}
