import React from 'react';
import { 
  Dashboard as DashboardIcon, 
  Assessment as AssessmentIcon, 
  ImportExport as ImportExportIcon, 
  Build as BuildIcon, 
  Chat as ChatIcon,
  BarChart as DataIcon,
  DesignServices as DesignIcon,
  SolarPower as PVSitesIcon,
  Handyman as MaintenanceIcon,
  Settings as SettingsIcon,
  ManageAccounts as ManagementIcon,
  Analytics as AnalyticsIcon,
  DescriptionOutlined as ReportsIcon,
  CompareArrows as MCDAIcon,
  Science as PythonIcon
} from '@mui/icons-material';

export interface SubMenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

export interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  subItems?: SubMenuItem[];
}

export const menuItems: MenuItem[] = [
  { 
    text: 'Main Dashboard', 
    icon: <DashboardIcon />, 
    path: '/',
  },
  { 
    text: 'Data', 
    icon: <DataIcon />, 
    path: '/data',
    subItems: [
      { text: 'Survey Analysis', icon: <AnalyticsIcon />, path: '/data/survey-analysis' },
      { text: 'Detail View', icon: <AssessmentIcon />, path: '/data/detail-view' },
      { text: 'Import', icon: <ImportExportIcon />, path: '/data/import' },
      { text: 'Enhanced Import (Python)', icon: <PythonIcon />, path: '/data/enhanced-import' },
    ]
  },
  { 
    text: 'Design', 
    icon: <DesignIcon />, 
    path: '/design',
  },
  { 
    text: 'MCDA Analysis', 
    icon: <MCDAIcon />, 
    path: '/mcda',
  },
  { 
    text: 'PV Sites', 
    icon: <PVSitesIcon />, 
    path: '/pv-sites',
  },
  { 
    text: 'Maintenance', 
    icon: <MaintenanceIcon />, 
    path: '/maintenance',
    subItems: [
      { text: 'Analytics', icon: <AssessmentIcon />, path: '/maintenance/analytics' },
      { text: 'WhatsApp Bot', icon: <ChatIcon />, path: '/maintenance/whatsapp-bot' },
    ]
  },
  { 
    text: 'Reports', 
    icon: <ReportsIcon />, 
    path: '/reports',
  },
  { 
    text: 'Settings', 
    icon: <SettingsIcon />, 
    path: '/settings',
  },
  { 
    text: 'Management', 
    icon: <ManagementIcon />, 
    path: '/management',
  },
];
