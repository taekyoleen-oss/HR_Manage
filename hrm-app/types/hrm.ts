// HRM 도메인용 named export. `Database['public']['Enums']`에서 추출.
// `types/database.types.ts`는 `npm run db:types`로 매번 덮어쓰여지므로,
// 코드가 의존하는 enum/row 타입은 이 파일에서 별도로 노출한다.

import type { Database } from './database.types';

export type { Database } from './database.types';

// 기존 도메인
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

// v1.2 — 출장
export type BusinessTripType = Database['public']['Enums']['hrm_business_trip_type'];
export type BusinessTripTransport = Database['public']['Enums']['hrm_business_trip_transport'];
export type BusinessTripStatus = Database['public']['Enums']['hrm_business_trip_status'];
export type BusinessTripRow = Database['public']['Tables']['hrm_business_trips']['Row'];
export type BusinessTripInsert = Database['public']['Tables']['hrm_business_trips']['Insert'];

// v1.2 — 경조사
export type FamilyRelation = Database['public']['Enums']['hrm_family_relation'];
export type FamilyEventKind = Database['public']['Enums']['hrm_family_event_kind'];
export type FamilyEventUsageLimit = Database['public']['Enums']['hrm_family_event_usage_limit'];
export type FamilyEventPolicyRow = Database['public']['Tables']['hrm_family_event_policies']['Row'];
export type FamilyEventPolicyInsert = Database['public']['Tables']['hrm_family_event_policies']['Insert'];

// v1.2 — 재택
export type RemoteWorkStatus = Database['public']['Enums']['hrm_remote_work_status'];
export type RemoteWorkRow = Database['public']['Tables']['hrm_remote_work_requests']['Row'];

// v1.2 — 공지
export type AnnouncementCategory = Database['public']['Enums']['hrm_announcement_category'];
export type AnnouncementRow = Database['public']['Tables']['hrm_announcements']['Row'];

// v1.2 — 자산
export type AssetStatus = Database['public']['Enums']['hrm_asset_status'];
export type AssetRow = Database['public']['Tables']['hrm_assets']['Row'];
export type AssetAssignmentRow = Database['public']['Tables']['hrm_asset_assignments']['Row'];

// v1.2 — 인사이동
export type PositionChangeType = Database['public']['Enums']['hrm_position_change_type'];
export type PositionHistoryRow = Database['public']['Tables']['hrm_position_history']['Row'];

// v1.2 — 교육
export type TrainingRecordRow = Database['public']['Tables']['hrm_training_records']['Row'];

// 한국어 라벨
export const ROLE_LABEL: Record<UserRole, string> = {
  employee: '직원',
  manager: '매니저',
  admin: '관리자',
};

export const RELATION_LABEL: Record<FamilyRelation, string> = {
  self: '본인',
  spouse: '배우자',
  child: '자녀',
  parent: '부모',
  parent_in_law: '배우자 부모',
  sibling: '형제자매',
  grandparent: '조부모',
  grandchild: '손주',
};

export const FAMILY_EVENT_LABEL: Record<FamilyEventKind, string> = {
  wedding: '결혼',
  funeral: '사망',
  birth: '출산',
  maternity: '본인 출산',
  sixtieth: '회연',
  other: '기타',
};

export const USAGE_LIMIT_LABEL: Record<FamilyEventUsageLimit, string> = {
  once_lifetime: '평생 1회',
  once_per_year: '연 1회',
  once_per_target: '대상자별 1회',
  unlimited: '제한 없음',
};

export const TRIP_TYPE_LABEL: Record<BusinessTripType, string> = {
  domestic: '국내',
  overseas: '해외',
};

export const TRIP_TRANSPORT_LABEL: Record<BusinessTripTransport, string> = {
  flight: '항공',
  train: '철도',
  bus: '버스',
  car_company: '법인차량',
  car_personal: '자가용',
  ship: '선박',
  other: '기타',
};

export const TRIP_STATUS_LABEL: Record<BusinessTripStatus, string> = {
  pending: '결재 대기',
  approved: '승인',
  rejected: '반려',
  cancelled: '취소',
  in_progress: '출장 중',
  completed: '완료',
};

export const REMOTE_STATUS_LABEL: Record<RemoteWorkStatus, string> = {
  pending: '결재 대기',
  approved: '승인',
  rejected: '반려',
  cancelled: '취소',
};

export const ANNOUNCEMENT_CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  general: '일반',
  policy: '정책',
  event: '행사',
  system: '시스템',
  hr: '인사',
  urgent: '긴급',
};

export const ASSET_STATUS_LABEL: Record<AssetStatus, string> = {
  available: '보관 중',
  assigned: '배정 중',
  in_repair: '수리/점검',
  retired: '폐기',
};

export const POSITION_CHANGE_LABEL: Record<PositionChangeType, string> = {
  hire: '입사',
  promotion: '승진',
  demotion: '강등',
  transfer: '부서 이동',
  role_change: '권한 변경',
  resignation: '퇴사',
  other: '기타',
};
