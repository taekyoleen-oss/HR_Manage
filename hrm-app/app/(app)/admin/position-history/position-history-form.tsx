'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POSITION_CHANGE_LABEL, type PositionChangeType, type UserRole } from '@/types/hrm';

type Employee = { id: string; name: string; employeeNo: string };
type Department = { id: string; name: string };

export function PositionHistoryForm({ employees, departments }: { employees: Employee[]; departments: Department[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? '');
  const [changeType, setChangeType] = useState<PositionChangeType>('promotion');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [fromDepartmentId, setFromDepartmentId] = useState<string>('');
  const [toDepartmentId, setToDepartmentId] = useState<string>('');
  const [fromPosition, setFromPosition] = useState('');
  const [toPosition, setToPosition] = useState('');
  const [fromRole, setFromRole] = useState<UserRole | ''>('');
  const [toRole, setToRole] = useState<UserRole | ''>('');
  const [notes, setNotes] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return void toast.error('직원을 선택하세요');
    startTransition(async () => {
      const res = await fetch('/api/admin/position-history', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          changeType,
          effectiveDate,
          fromDepartmentId: fromDepartmentId || null,
          toDepartmentId: toDepartmentId || null,
          fromPosition: fromPosition.trim() || null,
          toPosition: toPosition.trim() || null,
          fromRole: fromRole || null,
          toRole: toRole || null,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('저장 실패', { description: json?.error?.message });
      toast.success('이력이 추가되었습니다');
      setFromPosition(''); setToPosition(''); setNotes('');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>직원</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeNo})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>변경 유형</Label>
          <Select value={changeType} onValueChange={(v) => setChangeType(v as PositionChangeType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(POSITION_CHANGE_LABEL) as PositionChangeType[]).map((k) => (
                <SelectItem key={k} value={k}>{POSITION_CHANGE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>적용일</Label>
          <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>이전 부서 (선택)</Label>
          <Select value={fromDepartmentId} onValueChange={setFromDepartmentId}>
            <SelectTrigger><SelectValue placeholder="(없음)" /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>새 부서 (선택)</Label>
          <Select value={toDepartmentId} onValueChange={setToDepartmentId}>
            <SelectTrigger><SelectValue placeholder="(없음)" /></SelectTrigger>
            <SelectContent>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>이전 직급/직책</Label>
          <Input value={fromPosition} onChange={(e) => setFromPosition(e.target.value)} placeholder="대리 / 팀장 / ..." />
        </div>
        <div className="space-y-2">
          <Label>새 직급/직책</Label>
          <Input value={toPosition} onChange={(e) => setToPosition(e.target.value)} placeholder="과장 / 부장 / ..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>이전 권한 (선택)</Label>
          <Select value={fromRole} onValueChange={(v) => setFromRole(v as UserRole)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">직원</SelectItem>
              <SelectItem value="manager">매니저</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>새 권한 (선택)</Label>
          <Select value={toRole} onValueChange={(v) => setToRole(v as UserRole)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">직원</SelectItem>
              <SelectItem value="manager">매니저</SelectItem>
              <SelectItem value="admin">관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>비고 (선택)</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="발령 사유, 평가 결과 등" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} 이력 추가
      </Button>
    </form>
  );
}
