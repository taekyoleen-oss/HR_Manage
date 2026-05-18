'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateLeaveDays } from '@/lib/leave/holidays';
import type { LeaveType } from '@/lib/leave/queries';

type Period = 'full_day' | 'am_half' | 'pm_half';

export function LeaveRequestForm({ leaveTypes }: { leaveTypes: LeaveType[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaveTypeId, setLeaveTypeId] = useState<string>(leaveTypes[0]?.id ?? '');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startPeriod, setStartPeriod] = useState<Period>('full_day');
  const [endPeriod, setEndPeriod] = useState<Period>('full_day');
  const [reason, setReason] = useState<string>('');

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      return calculateLeaveDays(parseLocalDate(startDate), parseLocalDate(endDate), startPeriod, endPeriod);
    } catch {
      return 0;
    }
  }, [startDate, endDate, startPeriod, endPeriod]);

  const sameDay = startDate && startDate === endDate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveTypeId) return toast.error('휴가 유형을 선택하세요');
    if (!startDate || !endDate) return toast.error('기간을 입력하세요');
    if (totalDays <= 0) return toast.error('영업일이 0일인 구간입니다');

    startTransition(async () => {
      const res = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId,
          startDate,
          endDate,
          startPeriod,
          endPeriod,
          totalDays,
          reason: reason || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('신청 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('휴가 신청이 접수되었습니다');
      router.push('/leave/history');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leaveType">휴가 유형</Label>
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger id="leaveType" className="h-11 md:h-10">
            <SelectValue placeholder="유형 선택" />
          </SelectTrigger>
          <SelectContent>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
                {t.deducts_from_annual ? '' : ' (연차 차감 없음)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11 md:h-10"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            className="h-11 md:h-10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startPeriod">{sameDay ? '구분' : '시작일 구분'}</Label>
          <Select value={startPeriod} onValueChange={(v) => setStartPeriod(v as Period)}>
            <SelectTrigger id="startPeriod" className="h-11 md:h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_day">종일</SelectItem>
              <SelectItem value="am_half">오전 반차</SelectItem>
              <SelectItem value="pm_half">오후 반차</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!sameDay && (
          <div className="space-y-2">
            <Label htmlFor="endPeriod">종료일 구분</Label>
            <Select value={endPeriod} onValueChange={(v) => setEndPeriod(v as Period)}>
              <SelectTrigger id="endPeriod" className="h-11 md:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_day">종일</SelectItem>
                <SelectItem value="am_half">오전 반차</SelectItem>
                <SelectItem value="pm_half">오후 반차</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">사유 (선택)</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="결재자에게 표시될 사유"
          maxLength={500}
        />
      </div>

      <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
        <span className="text-muted-foreground">계산된 휴가 일수 (주말·공휴일 제외)</span>
        <span className="font-semibold tabular-nums">{totalDays.toFixed(1)}일</span>
      </div>

      <Button type="submit" className="w-full h-11 md:h-10" disabled={pending || totalDays <= 0}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        신청 제출
      </Button>
    </form>
  );
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
