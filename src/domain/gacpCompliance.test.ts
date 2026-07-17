import { calculateCompliance } from './gacpCompliance';

describe('calculateCompliance', () => {
  it('returns 0% with default totalTasks when tasks is undefined', () => {
    expect(calculateCompliance(undefined)).toEqual({ complianceRate: 0, totalTasks: 5, completedTasks: 0 });
  });

  it('returns 100% when all tasks are true', () => {
    const result = calculateCompliance({ a: true, b: true, c: true });
    expect(result).toEqual({ totalTasks: 3, completedTasks: 3, complianceRate: 100 });
  });

  it('rounds a partial completion rate', () => {
    const result = calculateCompliance({ a: true, b: false, c: true });
    expect(result).toEqual({ totalTasks: 3, completedTasks: 2, complianceRate: 67 });
  });

  it('returns 0% when tasks is an empty object', () => {
    expect(calculateCompliance({})).toEqual({ totalTasks: 5, completedTasks: 0, complianceRate: 0 });
  });
});
