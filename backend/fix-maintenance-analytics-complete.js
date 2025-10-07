const fs = require('fs');
const path = require('path');

// Read the maintenanceAnalytics.ts file
const filePath = path.join(__dirname, 'src', 'services', 'maintenanceAnalytics.ts');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Applying comprehensive fix to maintenanceAnalytics.ts...');

// Fix 1: Add missing calculateUpcomingMaintenance method
const calculateUpcomingMaintenanceMethod = `
  private calculateUpcomingMaintenance(records: any[]): any {
    const upcoming = records.filter(r => 
      r.maintenanceStatus === 'PENDING' && 
      new Date(r.maintenanceDate) > new Date()
    );
    
    return {
      count: upcoming.length,
      nextDate: upcoming[0]?.maintenanceDate || null,
      types: upcoming.map(r => r.maintenanceType)
    };
  }`;

// Fix 2: Add missing calculateRecentIssues method
const calculateRecentIssuesMethod = `
  private calculateRecentIssues(records: any[]): any {
    const recent = records.filter(
      r => new Date(r.maintenanceDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    
    return {
      count: recent.length,
      severity: this.calculateIssueSeverity(recent),
      types: [...new Set(recent.map(r => r.maintenanceType))]
    };
  }`;

// Fix 3: Add missing calculateIssueSeverity method
const calculateIssueSeverityMethod = `
  private calculateIssueSeverity(records: any[]): 'LOW' | 'MODERATE' | 'HIGH' {
    const severityCount = records.filter(r => r.maintenanceType === 'CORRECTIVE').length;
    if (severityCount > 3) return 'HIGH';
    if (severityCount > 1) return 'MODERATE';
    return 'LOW';
  }`;

// Fix 4: Add missing calculateReliability method
const calculateReliabilityMethod = `
  private calculateReliability(records: any[]): number {
    const totalDays = 365;
    const failureDays = records.filter(r => r.maintenanceType === 'CORRECTIVE').length;
    return Math.max(0, (totalDays - failureDays) / totalDays * 100);
  }`;

// Add all missing methods before the calculateAlerts method
const methodsToAdd = calculateUpcomingMaintenanceMethod + calculateRecentIssuesMethod + calculateIssueSeverityMethod + calculateReliabilityMethod;

content = content.replace(
  /private generateAlerts\(system: any, records: any\[\]\): string\[\] \{/,
  methodsToAdd + '\n\n  private generateAlerts(system: any, records: any[]): string[] {'
);

// Fix 5: Fix the calculateHealthScore method to use proper async calls
content = content.replace(
  /private calculateHealthScore\(system: any, records: any\[\]\): number \{[\s\S]*?return Math\.max\(0, Math\.min\(100, score\)\);\s*\}/,
  `private async calculateHealthScore(system: any, records: any[]): Promise<number> {
    const metrics = await this.calculateSystemMetrics(system.id);
    const score = (
      (metrics.efficiency * 0.4) +
      (metrics.systemAvailability * 0.3) +
      (metrics.performanceRatio * 0.2) +
      (1 - metrics.downtime.percentage) * 0.1
    ) * 100;
    
    return Math.max(0, Math.min(100, score));
  }`
);

// Fix 6: Fix the calculateSystemStatus method to use proper async calls
content = content.replace(
  /healthScore: this\.calculateHealthScore\(system, records\)/,
  'healthScore: await this.calculateHealthScore(system, records)'
);

// Fix 7: Fix the systemMetrics property to match the expected type
content = content.replace(
  /systemMetrics: await this\.calculateSystemMetrics\(systemId\)/,
  `systemMetrics: {
        efficiency: system.performanceMetrics?.efficiency || 0,
        availability: system.performanceMetrics?.systemAvailability || 0,
        reliability: this.calculateReliability(records),
        performance: system.performanceMetrics?.performanceRatio || 0
      }`
);

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Applied comprehensive fix to maintenanceAnalytics.ts');
console.log('Fixed:');
console.log('- Added missing calculateUpcomingMaintenance method');
console.log('- Added missing calculateRecentIssues method');
console.log('- Added missing calculateIssueSeverity method');
console.log('- Added missing calculateReliability method');
console.log('- Fixed calculateHealthScore to be async');
console.log('- Fixed systemMetrics type mismatch');
console.log('- Fixed async method calls with proper await');
