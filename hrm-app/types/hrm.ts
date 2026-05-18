// HRM 도메인용 named export. `Database['public']['Enums']`에서 추출.
// `types/database.types.ts`는 `npm run db:types`로 매번 덮어쓰여지므로,
// 코드가 의존하는 enum/row 타입은 이 파일에서 별도로 노출한다.

import type { Database } from './database.types';

export type { Database } from './database.types';

export type UserRole = Database['public']['Enums']['hrm_user_role'];
export type EmploymentType = Database['public']['Enums']['hrm_employment_type'];
export type EmploymentStatus = Database['public']['Enums']['hrm_employment_status'];
export type Gender = Database['public']['Enums']['hrm_gender'];
export type LeavePeriod = Database['public']['Enums']['hrm_leave_period'];
export type LeaveRequestStatus = Database['public']['Enums']['hrm_leave_request_status'];
export type LeaveTransactionType = Database['public']['Enums']['hrm_leave_transaction_type'];
export type LeavePolicyBasis = Database['public']['Enums']['hrm_leave_policy_basis'];
export type NotificationChannel = Database['public']['Enums']['hrm_notification_channel'];
export type NotificationKind = Database['public']['Enums']['hrm_notification_kind'];
export type NotificationDeliveryStatus = Database['public']['Enums']['hrm_notification_delivery_status'];

export type NotificationRow = Database['public']['Tables']['hrm_notifications']['Row'];
export type EmployeeRow = Database['public']['Tables']['hrm_employees']['Row'];
export type EmployeeUpdate = Database['public']['Tables']['hrm_employees']['Update'];
export type LeaveRequestRow = Database['public']['Tables']['hrm_leave_requests']['Row'];
