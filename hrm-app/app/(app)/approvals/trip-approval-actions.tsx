'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';

export function TripApprovalActions({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const res = await fetch('/api/trips/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('승인 실패', { description: json?.error?.message });
      toast.success('승인했습니다');
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) return void toast.error('반려 사유를 입력하세요');
    startTransition(async () => {
      const res = await fetch('/api/trips/reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId, reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('반려 실패', { description: json?.error?.message });
      toast.success('반려했습니다');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 self-start md:self-auto">
      <Button onClick={approve} disabled={pending} className="h-10 md:h-9">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        승인
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" disabled={pending} className="h-10 md:h-9">
            <X className="h-4 w-4" /> 반려
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>출장 반려 사유</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="반려 사유 (신청자에게 전달)" />
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button variant="destructive" onClick={reject} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} 반려 확정
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
