---
name: leave-cancellation-handler
description: 휴가 신청 취소 가능 여부를 판정하고, 환원 트랜잭션을 안전하게 처리하는 스킬(v1.1 신규). 신청 상태와 휴가 시작일을 검사하고 leave_balances·leave_transactions를 한 트랜잭션으로 갱신한다.
---

# leave-cancellation-handler (v1.1)

## 목적
설계서 Flow A-1을 결정론적으로 구현한다. **취소 가능 여부 판정**과 **환원 트랜잭션**의 두 책임을 가진다.

## 입력
- `requestId: uuid` — 취소 대상 신청
- `cancellingUserId: uuid` — 취소 요청자 (보통 본인)
- `reason?: string` — 취소 사유

## 출력
```ts
{
  ok: boolean;
  code?: 'NOT_OWNER' | 'INVALID_STATUS' | 'PAST_START_DATE' | 'DB_ERROR';
  message?: string;
  refundedDays?: number;
}
```

## 판정 매트릭스

| 상태 | 시작일 vs 오늘 | 결과 |
|------|--------------|------|
| `pending` | 무관 | ✅ 취소 + pending_days 환원 |
| `approved` | 시작일 > 오늘 | ✅ 취소 + used_days 환원 (트랜잭션) |
| `approved` | 시작일 ≤ 오늘 | ❌ `PAST_START_DATE` — 관리자 문의 |
| `rejected` | 무관 | ❌ `INVALID_STATUS` (UI에서 버튼 미노출) |
| `cancelled` | 무관 | ❌ `INVALID_STATUS` |
| `system_cancelled` | 무관 | ❌ `INVALID_STATUS` |

`employee_id != cancellingUserId` → ❌ `NOT_OWNER`

## 트랜잭션 (Postgres 함수로 캡슐화)

```sql
CREATE OR REPLACE FUNCTION cancel_leave_request(req_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r hrm_leave_requests;
  caller uuid := auth.uid();
BEGIN
  SELECT * INTO r FROM hrm_leave_requests WHERE id = req_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.employee_id != caller THEN RAISE EXCEPTION 'NOT_OWNER'; END IF;
  IF r.status NOT IN ('pending','approved') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  IF r.status = 'approved' AND r.start_date <= current_date THEN RAISE EXCEPTION 'PAST_START_DATE'; END IF;

  -- 1) 신청 상태 업데이트
  UPDATE hrm_leave_requests
  SET status = 'cancelled', cancelled_at = now(), cancelled_by = caller, cancellation_reason = p_reason
  WHERE id = req_id;

  -- 2) 잔여 환원
  IF r.status = 'pending' THEN
    UPDATE hrm_leave_balances
    SET pending_days = pending_days - r.total_days
    WHERE employee_id = r.employee_id AND year = EXTRACT(YEAR FROM r.start_date)::int;
  ELSE -- approved
    UPDATE hrm_leave_balances
    SET used_days = used_days - r.total_days
    WHERE employee_id = r.employee_id AND year = EXTRACT(YEAR FROM r.start_date)::int;
  END IF;

  -- 3) 감사 로그
  INSERT INTO hrm_leave_transactions (employee_id, transaction_type, days, related_request_id, reason, performed_by)
  VALUES (r.employee_id, 'refund', r.total_days, req_id,
          coalesce(p_reason, '신청자 취소로 환원'), caller);
END $$;
```

## API에서의 호출
- Route Handler: `POST /api/leave/cancel`
- 1차 판정은 클라이언트(UI에서 버튼 비활성), 2차 판정은 서버 사전 검사(`can_cancel_request()`), 3차는 트랜잭션 내부 `EXCEPTION`

## UI 메시지

| 코드 | 사용자 메시지 |
|------|------------|
| `PAST_START_DATE` | "이미 사용 중이거나 종료된 휴가는 취소할 수 없습니다. 관리자에게 문의하세요." |
| `INVALID_STATUS` | "취소할 수 없는 상태입니다." |
| `NOT_OWNER` | "본인 신청만 취소할 수 있습니다." |

## 부수효과 (트랜잭션 외부)
- 상급자에게 이메일: "신청 취소" 또는 "승인된 휴가 취소" 알림
- 트랜잭션 성공 후에만 발송

## 금지 사항
- 클라이언트에서 sequential 쿼리로 처리 (반드시 RPC 함수)
- 트랜잭션 내부에서 이메일 발송 (외부 I/O는 트랜잭션 밖)
- `system_cancelled` 상태를 사용자가 트리거 (이건 퇴사 처리 등 시스템 경로만)
