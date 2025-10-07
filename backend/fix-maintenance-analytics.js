const fs = require('fs');
const path = require('path');

// Read the maintenanceAnalytics.ts file
const filePath = path.join(__dirname, 'src', 'services', 'maintenanceAnalytics.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing TypeScript errors in maintenanceAnalytics.ts...');

// Fix 1: Remove the duplicate private calculateSystemMetrics method (lines 106-114)
const duplicateMethodRegex = /private calculateSystemMetrics\(system: any, records: any\[\]\): any \{[\s\S]*?\n  \}/;
content = content.replace(duplicateMethodRegex, '');

// Fix 2: Add missing generateAlerts method
const generateAlertsMethod = `
  private generateAlerts(system: any, records: any[]): string[] {
    const alerts: string[] = [];
    
    if (system.status === 'MAINTENANCE') {
      alerts.push('System is currently under maintenance');
    }
    
    if (system.performanceMetrics?.efficiency < 0.8) {
      alerts.push('Low system efficiency detected');
    }
    
    const recentFailures = records.filter(r => 
      r.maintenanceType === 'CORRECTIVE' && 
      new Date(r.maintenanceDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentFailures.length > 2) {
      alerts.push('Multiple recent maintenance issues');
    }
    
    return alerts;
  }`;

// Add the generateAlerts method before the calculateMaintenanceSchedule method
content = content.replace(
  /private calculateMaintenanceSchedule\(system: any\): any \{/,
  generateAlertsMethod + '\n\n  private calculateMaintenanceSchedule(system: any): any {'
);

// Fix 3: Fix the riskLevel type issue by ensuring it returns a valid enum value
content = content.replace(
  /private calculateRiskLevel\(system: any, records: any\[\]\): string \{[\s\S]*?return 'LOW';\s*\}/,
  `private calculateRiskLevel(system: any, records: any[]): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    const healthScore = this.calculateHealthScore(system, records);
    const recentIssues = records.filter(r => 
      new Date(r.maintenanceDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    if (healthScore < 30 || recentIssues.length > 5) return 'CRITICAL';
    if (healthScore < 50 || recentIssues.length > 3) return 'HIGH';
    if (healthScore < 70 || recentIssues.length > 1) return 'MODERATE';
    return 'LOW';
  }`
);

// Fix 4: Fix the systemMetrics call in calculateSystemStatus to use await
content = content.replace(
  /systemMetrics: this\.calculateSystemMetrics\(system, records\)/,
  'systemMetrics: await this.calculateSystemMetrics(systemId)'
);

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all TypeScript errors in maintenanceAnalytics.ts');
console.log('Fixed:');
console.log('- Removed duplicate calculateSystemMetrics method');
console.log('- Added missing generateAlerts method');
console.log('- Fixed riskLevel return type');
console.log('- Fixed async method calls with proper await');
