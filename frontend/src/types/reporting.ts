export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'PERFORMANCE' | 'MAINTENANCE' | 'FINANCIAL' | 'OPERATIONAL';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  metrics: Metric[];
  filters: Filter[];
  format: 'PDF' | 'CSV' | 'EXCEL' | 'HTML';
  recipients: string[];
  schedule: Schedule;
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  unit: string;
  calculation: string;
  thresholds: Threshold[];
}

export interface Filter {
  field: string;
  operator: 'EQ' | 'NE' | 'GT' | 'LT' | 'GTE' | 'LTE' | 'IN' | 'NOT_IN';
  value: any;
}

export interface Threshold {
  value: number;
  color: string;
  message: string;
  action: string;
}

export interface Schedule {
  type: 'CRON' | 'INTERVAL' | 'ON_DEMAND';
  expression: string;
  timezone: string;
  nextRun: Date;
}

export interface ReportData {
  id: string;
  reportId: string;
  generatedAt: Date;
  data: Record<string, any>;
  metrics: Record<string, number>;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  content: string;
  variables: string[];
  styles: Record<string, any>;
}

export interface ReportExport {
  id: string;
  reportId: string;
  format: string;
  filename: string;
  url: string;
  generatedAt: Date;
  size: number;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: Layout;
  refreshInterval: number;
  filters: Filter[];
}

export interface Widget {
  id: string;
  type: 'CHART' | 'TABLE' | 'KPI' | 'MAP' | 'TEXT';
  title: string;
  metrics: Metric[];
  filters: Filter[];
  configuration: Record<string, any>;
  position: Position;
}

export interface Layout {
  type: 'GRID' | 'FREEFORM';
  columns: number;
  rows: number;
  spacing: number;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReportHistory {
  id: string;
  reportId: string;
  generatedAt: Date;
  status: 'SUCCESS' | 'FAILED';
  duration: number;
  error?: string;
  recipients: string[];
}

export interface ReportSubscription {
  id: string;
  reportId: string;
  userId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  deliveryMethod: 'EMAIL' | 'DOWNLOAD' | 'API';
  active: boolean;
  lastSent: Date;
}
