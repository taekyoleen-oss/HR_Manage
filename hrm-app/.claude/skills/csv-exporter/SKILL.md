---
name: csv-exporter
description: v1.1 강화. 관리자 데이터 내보내기를 처리하는 스킬. 민감정보 컬럼을 화이트리스트 방식으로 차단하고, 권한별 데이터 범위를 강제하며, 감사 로그를 남긴다.
---

# csv-exporter (v1.1)

## 목적
설계서 5.5의 CSV 내보내기 정책을 결정론적으로 강제한다. **민감정보는 어떠한 경로로도 CSV에 포함되지 않는다.**

## 입력
- `exportType: 'leave_history' | 'leave_balance' | 'department_stats'`
- 호출자 user (employee/manager/admin)
- 필터 (기간, 부서 등)

## 출력
- CSV 파일 (UTF-8 BOM, 한글 헤더)
- `hrm_audit_logs`에 기록

## 화이트리스트 (코드에서 상수로)

```ts
// lib/export/csv.ts
export const ALLOWED_COLUMNS = {
  leave_history: [
    'employee_no', 'name_ko', 'department_name', 'position',
    'leave_type', 'start_date', 'end_date', 'total_days',
    'status', 'requested_at'
  ],
  leave_balance: [
    'employee_no', 'name_ko', 'department_name',
    'granted_days', 'used_days', 'pending_days', 'remaining_days', 'expires_at'
  ],
  department_stats: [
    'department_name', 'employee_count',
    'leave_days_total', 'leave_days_avg', 'utilization_rate'
  ],
} as const;
```

## 금지 컬럼 (절대 미포함)

```ts
export const FORBIDDEN_COLUMNS = [
  'resident_number',        // (저장 안 함, 방어적 차단)
  'birth_date', 'gender',
  'phone', 'address',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
  'family',                 // hrm_employee_family
  'salary', 'compensation', // hrm_employee_compensation
  'education', 'career', 'certifications',
  'documents',
  'profile_image_url',
];
```

## 권한별 데이터 범위 강제

```ts
function applyScope(query: PostgrestQueryBuilder, user: User, type: ExportType) {
  if (user.role === 'admin') return query; // 전체
  if (user.role === 'manager') {
    // 본인 + 직속 부하
    return query.or(`employee_id.eq.${user.id},employee_id.in.(${managedIds.join(',')})`);
  }
  // employee
  return query.eq('employee_id', user.id);
}
```

## CSV 생성 표준

```ts
import { stringify } from 'csv-stringify/sync';

export function buildCsv(
  rows: Record<string, unknown>[],
  exportType: keyof typeof ALLOWED_COLUMNS
): Buffer {
  const allowed = ALLOWED_COLUMNS[exportType];

  // 1) 화이트리스트 강제: rows의 각 객체에서 allowed 키만 추출
  const filtered = rows.map(row =>
    Object.fromEntries(allowed.map(col => [col, row[col] ?? '']))
  );

  // 2) 헤더는 한국어
  const koHeaders: Record<string, string> = {
    employee_no: '사번',
    name_ko: '이름',
    department_name: '부서',
    position: '직급',
    leave_type: '휴가 유형',
    start_date: '시작일',
    end_date: '종료일',
    total_days: '일수',
    status: '상태',
    requested_at: '신청일',
    granted_days: '부여일수',
    used_days: '사용일수',
    pending_days: '대기일수',
    remaining_days: '잔여일수',
    expires_at: '소멸예정일',
    employee_count: '인원수',
    leave_days_total: '휴가일수합계',
    leave_days_avg: '평균사용일수',
    utilization_rate: '사용률(%)',
  };

  const csv = stringify(filtered, {
    header: true,
    columns: allowed.map(c => ({ key: c, header: koHeaders[c] ?? c })),
    bom: true, // Excel 한글 호환
  });

  return Buffer.from(csv, 'utf-8');
}
```

## 감사 로그

```ts
await supabase.from('hrm_audit_logs').insert({
  actor_id: user.id,
  action: `csv_export.${exportType}`,
  target_table: 'multiple',
  metadata: { row_count: rows.length, filters, ip_address },
});
```

## Route Handler 예시

```ts
// app/api/exports/leave-csv/route.ts
export async function GET(req: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get('type') as keyof typeof ALLOWED_COLUMNS;
  if (!type || !(type in ALLOWED_COLUMNS)) {
    return Response.json({ error: { code: 'INVALID_TYPE' } }, { status: 400 });
  }

  const rows = await fetchScopedRows(supabase, user, type, parseFilters(url.searchParams));
  const csv = buildCsv(rows, type);

  await logExport(supabase, user, type, rows.length);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}_${formatDate(new Date())}.csv"`,
    },
  });
}
```

## 빌드 차단 검증 (CI)

```bash
# 금지 컬럼명이 ALLOWED_COLUMNS에 포함되지 않는지
node -e "
const { ALLOWED_COLUMNS, FORBIDDEN_COLUMNS } = require('./lib/export/csv');
const all = Object.values(ALLOWED_COLUMNS).flat();
const violation = FORBIDDEN_COLUMNS.find(c => all.includes(c));
if (violation) { console.error('FORBIDDEN:', violation); process.exit(1); }
console.log('OK');
"
```

## 금지 사항
- ALLOWED_COLUMNS 우회 (사용자 입력으로 컬럼 명시 등)
- `SELECT *` 결과를 그대로 CSV로 흘리기
- 권한 범위 검증 없이 admin 가정
- 감사 로그 누락
