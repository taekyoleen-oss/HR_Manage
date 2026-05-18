-- HRM v1.1 — 마이그레이션 #8: Storage 버킷 + 정책

BEGIN;

-- profile-images: 본인 업로드, 인증 사용자 조회
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  false,
  5242880,                    -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- employee-documents: admin 전용
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  false,
  20971520,                   -- 20 MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- profile-images 정책
CREATE POLICY "profile_images_select_authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_insert_self"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_images_update_self"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_images_delete_self"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- employee-documents 정책 (admin만)
CREATE POLICY "employee_documents_admin_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-documents' AND is_admin());

CREATE POLICY "employee_documents_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-documents' AND is_admin());

CREATE POLICY "employee_documents_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-documents' AND is_admin());

CREATE POLICY "employee_documents_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-documents' AND is_admin());

COMMIT;
