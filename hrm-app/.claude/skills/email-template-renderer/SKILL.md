---
name: email-template-renderer
description: React Email로 HRM 알림 메일 템플릿을 작성하고 변수 바인딩 + Resend 발송을 표준화하는 스킬. 휴가 신청/승인/반려/취소 알림, 비밀번호 재설정, 신규 직원 초대 이메일을 다룬다.
---

# email-template-renderer

## 목적
React Email 컴포넌트를 사용해 일관된 HRM 알림 메일 템플릿을 작성하고 Resend로 발송한다.

## 입력
- 템플릿 종류: `leave_request_submitted`, `leave_approved`, `leave_rejected`, `leave_cancelled_by_employee`, `password_reset`, `employee_invitation`
- 변수 페이로드 (타입 안전)

## 출력
- `lib/email/templates/<name>.tsx` (React Email 컴포넌트)
- `lib/email/send.ts`의 발송 함수
- 발송 결과를 `hrm_email_logs`에 기록

## 표준 템플릿 구조

```tsx
// lib/email/templates/leave-request-submitted.tsx
import { Html, Body, Container, Heading, Text, Button, Hr } from '@react-email/components';

type Props = {
  approverName: string;
  applicantName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  approvalUrl: string;
};

export default function LeaveRequestSubmitted({...props}: Props) {
  return (
    <Html lang="ko">
      <Body style={{ fontFamily: 'Pretendard, -apple-system, sans-serif', backgroundColor: '#FAFBFC' }}>
        <Container style={{ maxWidth: 560, margin: '0 auto', padding: 24, backgroundColor: '#FFFFFF' }}>
          <Heading style={{ color: '#1A1D24' }}>휴가 승인 요청</Heading>
          <Text>{props.approverName}님, {props.applicantName}님의 휴가 신청이 도착했습니다.</Text>
          <Hr />
          <Text>유형: {props.leaveType}</Text>
          <Text>기간: {props.startDate} ~ {props.endDate} ({props.totalDays}일)</Text>
          {props.reason && <Text>사유: {props.reason}</Text>}
          <Button href={props.approvalUrl} style={{ backgroundColor: '#2563EB', color: '#FFF', padding: '12px 24px', borderRadius: 8 }}>
            결재함 바로가기
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

## 톤 가이드 (한국어)
- 존댓말, 간결, 객관적 정보 위주
- 이모지 사용 금지 (공식 사내 메일)
- 액션 버튼은 1개만 강조 (`Button`은 primary 컬러)
- 발신자: `{회사명} HR <{RESEND_FROM_EMAIL}>`

## 카피 표준

| 종류 | 제목 | 본문 핵심 |
|------|------|---------|
| `leave_request_submitted` | `[휴가 승인 요청] {applicant}님 휴가 신청` | 신청자, 유형, 기간, 사유, 결재함 링크 |
| `leave_approved` | `[휴가 승인 완료] {dateRange}` | 승인자, 잔여 연차 안내 |
| `leave_rejected` | `[휴가 반려] {dateRange}` | 반려자, 반려 사유 |
| `leave_cancelled_by_employee` | `[휴가 신청 취소] {applicant}님` | 취소 시점, 취소 사유, (승인 후 취소 시) 환원 일수 |
| `password_reset` | `[비밀번호 재설정] HRM` | 링크 + 24시간 만료 안내 |
| `employee_invitation` | `[HRM 계정 초대] {company}` | 초대 링크 + 비밀번호 설정 안내 |

## 발송 함수 표준

```ts
// lib/email/send.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import LeaveRequestSubmitted from './templates/leave-request-submitted';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL!;

export async function sendLeaveRequestSubmittedEmail(props: { to: string; ...templateProps }) {
  const html = await render(<LeaveRequestSubmitted {...props} />);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: props.to,
    subject: `[휴가 승인 요청] ${props.applicantName}님 휴가 신청`,
    html,
  });
  await logEmail({ type: 'leave_request_submitted', to: props.to, success: !error, providerId: data?.id, error: error?.message });
  if (error) throw error;
}
```

## 재시도 정책
- 1회차 실패 → 1초 후 재시도
- 2회차 실패 → 2초 후 재시도
- 3회차 실패 → admin에게 알림 + `hrm_email_logs.status='failed'`

## 금지 사항
- 본문에 민감정보 포함 (생년월일, 주소, 급여 등)
- 인라인 hex 색상 (`#2563EB` 외) — 토큰 사전 정의 후 사용
- 동기 발송 (응답 지연 유발) — 호출처에서 `void` 또는 `waitUntil` 사용
- HTML 직접 작성 — 반드시 React Email 컴포넌트 사용
