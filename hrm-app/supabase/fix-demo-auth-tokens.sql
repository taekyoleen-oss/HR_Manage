-- seed-demo-users.sql에서 직접 INSERT한 auth.users는 confirmation_token,
-- recovery_token 등 GoTrue가 SELECT 시 not-null로 처리하는 컬럼이 NULL이라
-- "Database error querying schema" 500을 던진다.
-- 이 스크립트는 데모 사용자만 대상으로 토큰 컬럼을 빈 문자열로 정리한다.
-- Supabase Dashboard > SQL Editor에서 실행.

UPDATE auth.users
SET
  confirmation_token         = COALESCE(confirmation_token, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  recovery_token             = COALESCE(recovery_token, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, ''),
  email_confirmed_at         = COALESCE(email_confirmed_at, now())
  -- confirmed_at은 generated column이라 업데이트 불가. email_confirmed_at만 채우면 OK.
WHERE email LIKE '%@hrm.demo';

SELECT email, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
WHERE email LIKE '%@hrm.demo'
ORDER BY email;
