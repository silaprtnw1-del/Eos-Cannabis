import type { UserRole } from '../types';

/** Gated client actions, named `<domain>:<verb>`. Keep in sync with the
 * RLS policy matrix in migrations/0002_role_based_rls.sql. */
export type PermissionAction =
  | 'plant:register'
  | 'plant:transfer'
  | 'plant:archive'
  | 'batch:create'
  | 'mother:create'
  | 'room:create'
  | 'room:delete'
  | 'sop:submit_checklist';

const ROLE_PERMISSIONS: Record<PermissionAction, UserRole[]> = {
  'plant:register': ['OPERATOR', 'SUPERVISOR', 'ADMIN'],
  'plant:transfer': ['SUPERVISOR', 'ADMIN'],
  'plant:archive': ['ADMIN'],
  'batch:create': ['OPERATOR', 'SUPERVISOR', 'ADMIN'],
  'mother:create': ['SUPERVISOR', 'ADMIN'],
  'room:create': ['ADMIN'],
  'room:delete': ['ADMIN'],
  'sop:submit_checklist': ['OPERATOR', 'SUPERVISOR', 'ADMIN'],
};

/** Allow-list check — a role must be explicitly listed for an action,
 * so AUDITOR (and any future read-only role) is excluded by default. */
export function canPerform(role: UserRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[action].includes(role);
}
