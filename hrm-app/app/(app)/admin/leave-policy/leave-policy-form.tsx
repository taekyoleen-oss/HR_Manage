'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Basis = 'hire_date' | 'fiscal_year';

type PolicyForm = {
  id: string;
  basis: Basis;
  fiscalYearStartMonth: number;
  fiscalYearStartDay: number;
  maxCarryoverDays: number;
  promotionFirstWarnMonths: number;
  promotionSecondWarnMonths: number;
};

export function LeavePolicyForm({ policy }: { policy: PolicyForm }) {
  const router = useRouter();
  const [f, setF] = useState<PolicyForm>(policy);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch('/api/admin/leave-policy', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(f),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('저장 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('저장되었습니다');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label>산정 기준</Label>
        <Select value={f.basis} onValueChange={(v) => setF((s) => ({ ...s, basis: v as Basis }))}>
          <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fiscal_year">회계연도 기준</SelectItem>
            <SelectItem value="hire_date">입사일 기준</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {f.basis === 'fiscal_year' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>회계연도 시작 월</Label>
            <Input type="number" min={1} max={12} value={f.fiscalYearStartMonth} onChange={(e) => setF((s) => ({ ...s, fiscalYearStartMonth: Number(e.target.value) }))} className="h-11 md:h-10" />
          </div>
          <div className="space-y-2">
            <Label>일</Label>
            <Input type="number" min={1} max={31} value={f.fiscalYearStartDay} onChange={(e) => setF((s) => ({ ...s, fiscalYearStartDay: Number(e.target.value) }))} className="h-11 md:h-10" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>최대 이월 일수</Label>
        <Input type="number" min={0} step="0.5" value={f.maxCarryoverDays} onChange={(e) => setF((s) => ({ ...s, maxCarryoverDays: Number(e.target.value) }))} className="h-11 md:h-10" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>연차 촉진 1차 (개월 전)</Label>
          <Input type="number" min={0} value={f.promotionFirstWarnMonths} onChange={(e) => setF((s) => ({ ...s, promotionFirstWarnMonths: Number(e.target.value) }))} className="h-11 md:h-10" />
        </div>
        <div className="space-y-2">
          <Label>연차 촉진 2차 (개월 전)</Label>
          <Input type="number" min={0} value={f.promotionSecondWarnMonths} onChange={(e) => setF((s) => ({ ...s, promotionSecondWarnMonths: Number(e.target.value) }))} className="h-11 md:h-10" />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="h-11 md:h-10">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        저장
      </Button>
    </form>
  );
}
