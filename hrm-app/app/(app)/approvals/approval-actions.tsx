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
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';

type Props = { requestId: string; employeeName: string; summary: string };

export function ApprovalActions({ requestId, employeeName, summary }: Props) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pending, startTransition] = useTransition();

  function onApprove() {
    startTransition(async () => {
      const res = await fetch('/api/leave/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('승인 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('승인했습니다');
      router.refresh();
    });
  }

  function onReject() {
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력하세요');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/leave/reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, reason: rejectReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('반려 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('반려했습니다');
      setRejectOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2 self-start md:self-auto">
      <Button onClick={onApprove} disabled={pending} className="h-10 md:h-9">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        승인
      </Button>
      <ResponsiveDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <ResponsiveDialogTrigger asChild>
          <Button variant="outline" disabled={pending} className="h-10 md:h-9">
            <X className="h-4 w-4" /> 반려
          </Button>
        </ResponsiveDialogTrigger>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>반려 사유 입력</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {employeeName} — {summary}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="반려 사유 (직원에게 전달됩니다)"
            maxLength={500}
          />
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="h-11 md:h-9">
              취소
            </Button>
            <Button variant="destructive" onClick={onReject} disabled={pending} className="h-11 md:h-9">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              반려 확정
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
