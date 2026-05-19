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
import type { FamilyEventPolicyRowSlim } from '@/lib/family-events/queries';
import { RELATION_LABEL, FAMILY_EVENT_LABEL, USAGE_LIMIT_LABEL } from '@/types/hrm';

type Period = 'full_day' | 'am_half' | 'pm_half';

export function LeaveRequestForm({
  leaveTypes,
  familyPolicies,
}: {
  leaveTypes: LeaveType[];
  familyPolicies: FamilyEventPolicyRowSlim[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaveTypeId, setLeaveTypeId] = useState<string>(leaveTypes[0]?.id ?? '');
  const [familyPolicyId, setFamilyPolicyId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startPeriod, setStartPeriod] = useState<Period>('full_day');
  const [endPeriod, setEndPeriod] = useState<Period>('full_day');
  const [reason, setReason] = useState<string>('');

  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);
  const isFamilyEvent = selectedType?.code === 'family_event';
  const selectedPolicy = familyPolicies.find((p) => p.id === familyPolicyId);

  const calendarDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      return calculateLeaveDays(parseLocalDate(startDate), parseLocalDate(endDate), startPeriod, endPeriod);
    } catch {
      return 0;
    }
  }, [startDate, endDate, startPeriod, endPeriod]);

  // 경조사: 정책 기준 일수가 totalDays. 기본은 정책의 granted_days, 단 calendarDays와 정책 둘 중 작은 값.
  const totalDays = useMemo(() => {
    if (isFamilyEvent) {
      if (!selectedPolicy || calendarDays === 0) return 0;
      const granted = Number(selectedPolicy.granted_days);
      return Math.min(granted, calendarDays);
    }
    return calendarDays;
  }, [isFamilyEvent, selectedPolicy, calendarDays]);

  const overflowFamily = isFamilyEvent && selectedPolicy && calendarDays > Number(selectedPolicy.granted_days)
    ? calendarDays - Number(selectedPolicy.granted_days)
    : 0;

  const sameDay = startDate && startDate === endDate;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveTypeId) return void toast.error('휴가 유형을 선택하세요');
    if (!startDate || !endDate) return void toast.error('기간을 입력하세요');
    if (totalDays <= 0) return void toast.error('영업일이 0일인 구간입니다');

    if (isFamilyEvent) {
      if (!familyPolicyId) return void toast.error('경조사 사유를 선택하세요');
      submitFamilyEvent();
    } else {
      submitRegular();
    }
  }

  function submitRegular() {
    startTransition(async () => {
      const res = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          leaveTypeId, startDate, endDate, startPeriod, endPeriod, totalDays,
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

  function submitFamilyEvent() {
    startTransition(async () => {
      const res = await fetch('/api/leave/family-event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          policyId: familyPolicyId,
          startDate, endDate, totalDays,
          reason: reason || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('경조사 신청 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('경조사 휴가 신청이 접수되었습니다');
      router.push('/leave/history');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="leaveType">휴가 유형</Label>
        <Select value={leaveTypeId} onValueChange={(v) => { setLeaveTypeId(v); setFamilyPolicyId(''); }}>
          <SelectTrigger id="leaveType" className="h-11 md:h-10"><SelectValue placeholder="유형 선택" /></SelectTrigger>
          <SelectContent>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}{t.deducts_from_annual ? '' : ' (연차 차감 없음)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFamilyEvent && (
        <div className="space-y-2">
          <Label htmlFor="familyPolicy">경조사 사유</Label>
          <Select value={familyPolicyId} onValueChange={setFamilyPolicyId}>
            <SelectTrigger id="familyPolicy" className="h-11 md:h-10"><SelectValue placeholder="관계·사유를 선택" /></SelectTrigger>
            <SelectContent>
              {familyPolicies.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {Number(p.granted_days)}일
                  <span className="ml-1 text-muted-foreground text-xs">
                    ({RELATION_LABEL[p.relation]} / {FAMILY_EVENT_LABEL[p.event_kind]})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPolicy && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-1">
              <div>기준 일수: <strong className="tabular-nums">{Number(selectedPolicy.granted_days)}일</strong></div>
              <div>사용 한도: {USAGE_LIMIT_LABEL[selectedPolicy.usage_limit]}</div>
              {selectedPolicy.required_attachment_note && (
                <div>필수 첨부: <span className="text-warning">{selectedPolicy.required_attachment_note}</span></div>
              )}
              {selectedPolicy.description && (
                <div className="text-muted-foreground">{selectedPolicy.description}</div>
              )}
            </div>
          )}
        </div>
      )}

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

      {!isFamilyEvent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="startPeriod">{sameDay ? '구분' : '시작일 구분'}</Label>
            <Select value={startPeriod} onValueChange={(v) => setStartPeriod(v as Period)}>
              <SelectTrigger id="startPeriod" className="h-11 md:h-10"><SelectValue /></SelectTrigger>
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
                <SelectTrigger id="endPeriod" className="h-11 md:h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_day">종일</SelectItem>
                  <SelectItem value="am_half">오전 반차</SelectItem>
                  <SelectItem value="pm_half">오후 반차</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">사유 {isFamilyEvent ? '(선택)' : '(선택)'}</Label>
        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="결재자에게 표시될 사유" maxLength={500} />
      </div>

      <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
        <span className="text-muted-foreground">{isFamilyEvent ? '경조사 신청 일수' : '계산된 휴가 일수 (주말·공휴일 제외)'}</span>
        <span className="font-semibold tabular-nums">{totalDays.toFixed(1)}일</span>
      </div>

      {overflowFamily > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs space-y-1">
          <p className="text-warning font-medium">정책 기준({Number(selectedPolicy?.granted_days)}일) 초과 안내</p>
          <p className="text-muted-foreground">
            선택한 기간 중 영업일 기준 <strong>{overflowFamily}일</strong>이 정책 일수를 초과합니다.
            초과분은 별도로 연차 또는 무급 휴가로 분리 신청해 주세요. 본 화면에서는 정책 한도({Number(selectedPolicy?.granted_days)}일)까지만 접수됩니다.
          </p>
        </div>
      )}

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
