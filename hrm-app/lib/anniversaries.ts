import { createServerClient } from '@/lib/supabase/server';

// 다가오는 N일 내 생일·입사기념일 조회 (월·일 기준 매칭)
export async function getUpcomingAnniversaries(daysAhead = 14) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('hrm_employees')
    .select('id, name_ko, email, hire_date, birth_date, employment_status')
    .eq('employment_status', 'active');

  if (!data) return { birthdays: [], hireAnniversaries: [] };

  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(today.getDate() + daysAhead);

  type Row = (typeof data)[number];
  const matches = (sourceDate: string | null) => {
    if (!sourceDate) return null;
    const [, mm, dd] = sourceDate.split('-').map(Number);
    if (!mm || !dd) return null;
    for (let y = today.getFullYear(); y <= horizon.getFullYear(); y++) {
      const candidate = new Date(y, mm - 1, dd);
      if (candidate >= today && candidate <= horizon) return candidate;
    }
    return null;
  };

  const birthdays = data
    .map((e: Row) => {
      const m = matches(e.birth_date);
      return m ? { ...e, occurOn: m.toISOString().slice(0, 10) } : null;
    })
    .filter((x): x is Row & { occurOn: string } => !!x)
    .sort((a, b) => a.occurOn.localeCompare(b.occurOn));

  const hireAnniversaries = data
    .map((e: Row) => {
      const m = matches(e.hire_date);
      if (!m) return null;
      const years = m.getFullYear() - Number(e.hire_date.slice(0, 4));
      return years >= 1 ? { ...e, occurOn: m.toISOString().slice(0, 10), years } : null;
    })
    .filter((x): x is Row & { occurOn: string; years: number } => !!x)
    .sort((a, b) => a.occurOn.localeCompare(b.occurOn));

  return { birthdays, hireAnniversaries };
}
