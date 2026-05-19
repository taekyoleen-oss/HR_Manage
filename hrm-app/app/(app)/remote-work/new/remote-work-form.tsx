'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function RemoteWorkForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [contactMethod, setContactMethod] = useState('');

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s > e) return 0;
    let days = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const dow = cur.getDay();
      if (dow !== 0 && dow !== 6) days += 1;
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) return void toast.error('기간을 입력하세요');
    if (totalDays <= 0) return void toast.error('영업일이 0일입니다');
    if (!reason.trim()) return void toast.error('사유를 입력하세요');

    startTransition(async () => {
      const res = await fetch('/api/remote-work/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate, totalDays,
          reason: reason.trim(),
          workLocation: workLocation.trim() || null,
          contactMethod: contactMethod.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('신청 실패', { description: json?.error?.message });
        return;
      }
      toast.success('재택근무 신청이 접수되었습니다');
      router.push('/remote-work');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 md:h-10" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="h-11 md:h-10" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">사유</Label>
        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="예: 자녀 돌봄, 집중 업무 등" required maxLength={500} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="workLocation">재택 위치 (선택)</Label>
          <Input id="workLocation" value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} className="h-11 md:h-10" placeholder="예: 자택, 지방 본가" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactMethod">연락 방법 (선택)</Label>
          <Input id="contactMethod" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} className="h-11 md:h-10" placeholder="예: Slack DM, 휴대전화" />
        </div>
      </div>

      <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
        <span className="text-muted-foreground">영업일 기준</span>
        <span className="font-semibold tabular-nums">{totalDays}일</span>
      </div>

      <Button type="submit" className="w-full h-11 md:h-10" disabled={pending || totalDays <= 0}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        신청 제출
      </Button>
    </form>
  );
}
