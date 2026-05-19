import { createServerClient } from '@/lib/supabase/server';

export async function getActiveFamilyEventPolicies() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_family_event_policies')
    .select('id, code, name, relation, event_kind, granted_days, required_attachment_note, usage_limit, description, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order');
  return data ?? [];
}

export async function getAllFamilyEventPolicies() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_family_event_policies')
    .select('id, code, name, relation, event_kind, granted_days, required_attachment_note, usage_limit, description, is_active, sort_order, updated_at')
    .order('sort_order');
  return data ?? [];
}

export type FamilyEventPolicyRowSlim = Awaited<ReturnType<typeof getActiveFamilyEventPolicies>>[number];
