import { NextResponse } from 'next/server';
import type { z } from 'zod';

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export function failZod(err: z.ZodError) {
  return fail(
    'VALIDATION_FAILED',
    '입력 값이 유효하지 않습니다',
    422,
    err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  );
}

// Supabase Postgres 함수가 RAISE EXCEPTION한 메시지를 user-facing 한국어로 매핑.
export const PG_ERROR_MAP: Record<string, { message: string; status: number }> = {
  NOT_FOUND: { message: '대상을 찾을 수 없습니다', status: 404 },
  NOT_OWNER: { message: '본인 신청만 처리할 수 있습니다', status: 403 },
  INVALID_STATUS: { message: '현재 상태에서는 처리할 수 없습니다', status: 409 },
  PAST_START_DATE: { message: '시작일이 지나 본인이 취소할 수 없습니다. 관리자에게 문의하세요', status: 409 },
  FORBIDDEN: { message: '권한이 없습니다', status: 403 },
  INSUFFICIENT_BALANCE: { message: '잔여 휴가가 부족합니다', status: 422 },
  // v1.2 — 경조사
  POLICY_NOT_FOUND: { message: '선택한 경조사 기준이 없거나 비활성화되었습니다', status: 404 },
  EXCEEDS_POLICY: { message: '정책 기준 일수를 초과했습니다. 초과분은 연차 또는 무급 휴가로 분리 신청하세요', status: 422 },
  USAGE_LIMIT_EXCEEDED: { message: '이 사유는 이미 사용 한도에 도달했습니다', status: 409 },
  LEAVE_TYPE_NOT_FOUND: { message: '경조사 휴가 유형이 정의되지 않았습니다 (관리자 문의)', status: 500 },
  // v1.2 — 공통
  INVALID_DATE_RANGE: { message: '시작일이 종료일보다 늦습니다', status: 422 },
  PURPOSE_REQUIRED: { message: '출장 목적을 입력하세요', status: 422 },
  REPORT_REQUIRED: { message: '복귀 보고서를 입력하세요', status: 422 },
  REASON_REQUIRED: { message: '사유를 입력하세요', status: 422 },
};

export function failFromPg(message: string | undefined | null) {
  if (!message) return fail('UNKNOWN', '알 수 없는 오류', 500);
  const known = Object.entries(PG_ERROR_MAP).find(([code]) => message.includes(code));
  if (known) {
    const [code, info] = known;
    return fail(code, info.message, info.status);
  }
  return fail('DB_ERROR', message, 500);
}
