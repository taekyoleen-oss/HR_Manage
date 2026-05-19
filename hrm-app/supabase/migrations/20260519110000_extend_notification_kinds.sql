-- HRM v1.2.1 — 알림 종류 확장 (출장·재택·경조사)
-- 작성일: 2026-05-19

BEGIN;

-- 출장
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'trip_submitted';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'trip_approved';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'trip_rejected';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'trip_cancelled';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'trip_completed';

-- 재택근무
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'remote_submitted';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'remote_approved';
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'remote_rejected';

-- 경조사 휴가 (별도로 분리 — 일반 휴가와 컨텍스트가 다름)
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'family_event_submitted';

-- 공지사항 (신규 공지 게시)
ALTER TYPE hrm_notification_kind ADD VALUE IF NOT EXISTS 'announcement_published';

COMMIT;
