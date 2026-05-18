'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
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

type Props = {
  requestId: string;
  startDate: string;
  endDate: string;
  leaveTypeName: string;
  totalDays: number;
  previousStatus: 'pending' | 'approved';
};

export function CancelLeaveButton({
  requestId,
  startDate,
  endDate,
  leaveTypeName,
  totalDays,
  previousStatus,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const res = await fetch('/api/leave/cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, reason: reason || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('취소 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('휴가 신청이 취소되었습니다');
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 md:h-8 self-start md:self-auto">
          <X className="h-4 w-4" /> 취소
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>휴가 신청 취소</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {leaveTypeName} · {startDate} ~ {endDate} · {totalDays.toFixed(1)}일
            <br />
            {previousStatus === 'approved'
              ? '승인된 휴가입니다. 시작일 이전이라 본인 취소가 가능합니다.'
              : '승인 대기 상태입니다. 즉시 취소됩니다.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="cancel-reason" className="text-sm font-medium">
            취소 사유 (선택)
          </label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="감사 기록에 남습니다"
            maxLength={500}
          />
        </div>

        <ResponsiveDialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="h-11 md:h-9">
            돌아가기
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending} className="h-11 md:h-9">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            취소 확정
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
