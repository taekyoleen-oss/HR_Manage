// CSV 내보내기 헬퍼.
// 민감정보(주민번호, 급여, 계좌, 주소, 전화) 컬럼은 절대 ALLOWED_COLUMNS에 포함하지 않는다.
// 모든 CSV는 UTF-8 BOM을 prefix하여 Excel에서 한글이 깨지지 않게 한다.

export const UTF8_BOM = '﻿';

// 휴가 신청 CSV 화이트리스트
export const LEAVE_REQUEST_ALLOWED_COLUMNS = [
  '신청ID',
  '직원명',
  '부서',
  '휴가유형',
  '시작일',
  '종료일',
  '일수',
  '상태',
  '신청일',
  '승인일',
] as const;

// 직원 CSV 화이트리스트 (민감 컬럼 제외 - phone/address는 제외)
export const EMPLOYEE_ALLOWED_COLUMNS = [
  '이름',
  '이메일',
  '부서',
  '직책',
  '권한',
  '재직상태',
  '입사일',
] as const;

// 출장 CSV 화이트리스트 (v1.2)
export const TRIP_ALLOWED_COLUMNS = [
  '신청ID',
  '직원명',
  '부서',
  '구분',
  '목적지',
  '시작일',
  '종료일',
  '교통수단',
  '목적',
  '상태',
  '신청일',
  '승인일',
  '완료일',
] as const;

// 교육 CSV 화이트리스트 (v1.2)
export const TRAINING_ALLOWED_COLUMNS = [
  '직원명',
  '부서',
  '교육명',
  '제공처',
  '카테고리',
  '시작일',
  '종료일',
  '이수시간',
  '비용',
] as const;

// 자산 CSV 화이트리스트 (v1.2)
export const ASSET_ALLOWED_COLUMNS = [
  '자산번호',
  '분류',
  '모델명',
  '시리얼',
  '상태',
  '현재사용자',
  '구입일',
  '구입가',
] as const;

export const TRIP_TYPE_LABEL_KO: Record<string, string> = {
  domestic: '국내',
  overseas: '해외',
};

export const TRIP_STATUS_LABEL_KO: Record<string, string> = {
  pending: '결재대기',
  approved: '승인',
  rejected: '반려',
  cancelled: '취소',
  in_progress: '출장중',
  completed: '완료',
};

export const TRIP_TRANSPORT_LABEL_KO: Record<string, string> = {
  flight: '항공',
  train: '철도',
  bus: '버스',
  car_company: '법인차량',
  car_personal: '자가용',
  ship: '선박',
  other: '기타',
};

export const ASSET_STATUS_LABEL_KO: Record<string, string> = {
  available: '보관',
  assigned: '배정',
  in_repair: '수리',
  retired: '폐기',
};

// 금지 컬럼 목록 — 빌드 시 grep로 점검.
export const FORBIDDEN_CSV_COLUMNS = [
  '주민번호',
  '주민등록번호',
  'ssn',
  '급여',
  'salary',
  '계좌',
  'account',
  'phone',
  '연락처',
  '주소',
  'address',
] as const;

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>, columns: readonly string[]): string {
  const lines: string[] = [];
  lines.push(columns.map(escapeCell).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c] ?? '')).join(','));
  }
  return UTF8_BOM + lines.join('\r\n');
}

function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const STATUS_LABEL_KO: Record<string, string> = {
  pending: '승인대기',
  approved: '승인됨',
  rejected: '반려',
  cancelled: '취소',
  system_cancelled: '자동취소',
};

export const ROLE_LABEL_KO: Record<string, string> = {
  employee: '일반',
  manager: '상급자',
  admin: '관리자',
};

export const EMPLOYMENT_STATUS_LABEL_KO: Record<string, string> = {
  active: '재직',
  on_leave: '휴직',
  resigned: '퇴사',
};
