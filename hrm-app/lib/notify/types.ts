import type { NotificationChannel, NotificationKind } from '@/types/hrm';

export type NotifyKind = NotificationKind;
export type NotifyChannel = NotificationChannel;

// 단일 알림 발송 파라미터. 채널 선택은 router(index.ts)가 결정.
export type NotifyInput = {
  kind: NotifyKind;
  recipientEmployeeId: string;
  senderEmployeeId?: string | null;
  relatedResourceType?: string | null;
  relatedResourceId?: string | null;
  // 템플릿 변수 — kind마다 필요한 키가 다름. templates.ts에서 정의.
  vars?: Record<string, string | number>;
  // 강제 채널 지정(테스트/특수 케이스). 비우면 라우터 정책 사용.
  forceChannels?: NotifyChannel[];
};

// 렌더된 메시지 (channel-agnostic)
export type RenderedMessage = {
  title: string;
  body: string;
  linkPath: string | null;
};
