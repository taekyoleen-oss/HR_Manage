'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';

export function TripActions({
  tripId,
  canApprove,
  canReject,
  canCancel,
}: {
  tripId: string;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  function approve() {
    if (!confirm('이 출장을 승인하시겠습니까?')) return;
    startTransition(async () => {
      const res = await fetch('/api/trips/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('승인 실패', { description: json?.error?.message });
      toast.success('승인되었습니다');
      router.refresh();
    });
  }

  function reject() {
    if (!rejectReason.trim()) return void toast.error('반려 사유를 입력하세요');
    startTransition(async () => {
      const res = await fetch('/api/trips/reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId, reason: rejectReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('반려 실패', { description: json?.error?.message });
      toast.success('반려되었습니다');
      setRejectOpen(false);
      setRejectReason('');
      router.refresh();
    });
  }

  function cancel() {
    startTransition(async () => {
      const res = await fetch('/api/trips/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId, reason: cancelReason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('취소 실패', { description: json?.error?.message });
      toast.success('출장이 취소되었습니다');
      setCancelOpen(false);
      setCancelReason('');
      router.refresh();
    });
  }

  return (
    <>
      {canApprove && (
        <Button onClick={approve} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} 승인
        </Button>
      )}
      {canReject && (
        <ResponsiveDialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <ResponsiveDialogTrigger asChild>
            <Button variant="outline" disabled={pending}>반려</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="sm:max-w-md">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>출장 반려</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>반려 사유를 신청자에게 전달합니다.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} maxLength={500} placeholder="반려 사유" />
            <ResponsiveDialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>취소</Button>
              <Button variant="destructive" onClick={reject} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} 반려 확정
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}
      {canCancel && (
        <ResponsiveDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <ResponsiveDialogTrigger asChild>
            <Button variant="outline" disabled={pending}>취소</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="sm:max-w-md">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>출장 취소</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>시작일 이전 신청만 본인이 취소할 수 있습니다.</ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} maxLength={500} placeholder="취소 사유 (선택)" />
            <ResponsiveDialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setCancelOpen(false)}>닫기</Button>
              <Button onClick={cancel} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} 취소 확정
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      )}
    </>
  );
}
