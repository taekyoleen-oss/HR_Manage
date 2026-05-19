import { createServerClient } from '@/lib/supabase/server';

const BASE = 'id, title, body, category, is_pinned, is_published, published_at, expires_at, author_id, created_at, updated_at';

export async function getActiveAnnouncements(limit = 50) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_announcements')
    .select(`${BASE}, hrm_employees!hrm_announcements_author_id_fkey(name_ko)`)
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAllAnnouncementsForAdmin(limit = 100) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_announcements')
    .select(`${BASE}, hrm_employees!hrm_announcements_author_id_fkey(name_ko)`)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAnnouncement(id: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_announcements')
    .select(`${BASE}, hrm_employees!hrm_announcements_author_id_fkey(name_ko)`)
    .eq('id', id)
    .maybeSingle();
  return data;
}

export type AnnouncementListRow = Awaited<ReturnType<typeof getActiveAnnouncements>>[number];
