export interface ComplianceResult {
  totalTasks: number;
  completedTasks: number;
  complianceRate: number;
}

export function calculateCompliance(tasks: Record<string, boolean> | undefined): ComplianceResult {
  if (!tasks) return { complianceRate: 0, totalTasks: 5, completedTasks: 0 };
  const keys = Object.keys(tasks);
  const completed = keys.filter((k) => tasks[k]).length;
  return {
    totalTasks: keys.length || 5,
    completedTasks: completed,
    complianceRate: keys.length > 0 ? Math.round((completed / keys.length) * 100) : 0,
  };
}
