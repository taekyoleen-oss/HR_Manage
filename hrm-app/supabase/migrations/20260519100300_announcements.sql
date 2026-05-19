-- HRM v1.2 — 사내 공지사항
-- 관리자가 등록하면 전직원이 열람. 카테고리·중요도·고정(pin) 지원.
-- 작성일: 2026-05-19

BEGIN;

CREATE TYPE hrm_announcement_category AS ENUM (
  'general',     -- 일반
  'policy',      -- 정책/규정
  'event',       -- 행사
  'system',      -- 시스템 점검
  'hr',          -- 인사
  'urgent'       -- 긴급
);

CREATE TABLE hrm_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category hrm_announcement_category NOT NULL DEFAULT 'general',
  is_pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  author_id uuid REFERENCES hrm_employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_published ON hrm_announcements(is_published, published_at DESC);
CREATE INDEX idx_announcements_category ON hrm_announcements(category);

CREATE TRIGGER trg_announcements_updated_at BEFORE UPDATE ON hrm_announcements
  FOR EACH ROW EXECUTE FUNCTION hrm_touch_updated_at();

COMMENT ON TABLE hrm_announcements IS '사내 공지사항. 관리자 CRUD, 인증 사용자 SELECT.';

-- RLS
ALTER TABLE hrm_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_active"
  ON hrm_announcements FOR SELECT TO authenticated
  USING (is_active_user() AND is_published = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "announcements_admin_select_all"
  ON hrm_announcements FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "announcements_admin_modify"
  ON hrm_announcements FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

COMMIT;
