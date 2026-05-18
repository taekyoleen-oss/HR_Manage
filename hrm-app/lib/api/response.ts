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
