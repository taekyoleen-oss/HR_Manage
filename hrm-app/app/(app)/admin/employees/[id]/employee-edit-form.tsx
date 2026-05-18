'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Option = { id: string; name: string };
type Role = 'employee' | 'manager' | 'admin';
type Type = 'regular' | 'contract' | 'intern' | 'part_time';
type Status = 'active' | 'on_leave' | 'resigned';

type Employee = {
  id: string;
  email: string;
  nameKo: string;
  nameEn: string;
  employeeNo: string;
  role: Role;
  employmentType: Type;
  employmentStatus: Status;
  hireDate: string;
  resignationDate: string | null;
  departmentId: string | null;
  managerId: string | null;
  jobTitle: string;
  position: string;
  phone: string;
};

const ROLE_OPTS: { value: Role; label: string }[] = [
  { value: 'employee', label: '일반 직원' },
  { value: 'manager', label: '상급자' },
  { value: 'admin', label: '관리자' },
];
const TYPE_OPTS: { value: Type; label: string }[] = [
  { value: 'regular', label: '정규직' },
  { value: 'contract', label: '계약직' },
  { value: 'intern', label: '인턴' },
  { value: 'part_time', label: '파트타임' },
];
const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: 'active', label: '재직' },
  { value: 'on_leave', label: '휴직' },
  { value: 'resigned', label: '퇴사' },
];

export function EmployeeEditForm({
  employee,
  departments,
  managers,
}: {
  employee: Employee;
  departments: Option[];
  managers: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState<Employee>(employee);

  function set<K extends keyof Employee>(k: K, v: Employee[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...f,
          departmentId: f.departmentId || null,
          managerId: f.managerId || null,
          resignationDate: f.employmentStatus === 'resigned' ? f.resignationDate || new Date().toISOString().slice(0, 10) : null,
        }),
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

  const isResigned = f.employmentStatus === 'resigned';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="이름 (한)"><Input value={f.nameKo} onChange={(e) => set('nameKo', e.target.value)} className="h-11 md:h-10" required /></Field>
        <Field label="이름 (영)"><Input value={f.nameEn} onChange={(e) => set('nameEn', e.target.value)} className="h-11 md:h-10" /></Field>
        <Field label="이메일"><Input value={f.email} className="h-11 md:h-10" disabled /></Field>
        <Field label="사번"><Input value={f.employeeNo} onChange={(e) => set('employeeNo', e.target.value)} className="h-11 md:h-10" /></Field>
        <Field label="권한">
          <Select value={f.role} onValueChange={(v) => set('role', v as Role)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="고용 형태">
          <Select value={f.employmentType} onValueChange={(v) => set('employmentType', v as Type)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{TYPE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="재직 상태">
          <Select value={f.employmentStatus} onValueChange={(v) => set('employmentStatus', v as Status)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="입사일"><Input type="date" value={f.hireDate} onChange={(e) => set('hireDate', e.target.value)} className="h-11 md:h-10" required /></Field>
        {isResigned && (
          <Field label="퇴사일">
            <Input type="date" value={f.resignationDate ?? ''} onChange={(e) => set('resignationDate', e.target.value)} className="h-11 md:h-10" required />
          </Field>
        )}
        <Field label="부서">
          <Select value={f.departmentId ?? 'none'} onValueChange={(v) => set('departmentId', v === 'none' ? null : v)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미지정</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="상급자">
          <Select value={f.managerId ?? 'none'} onValueChange={(v) => set('managerId', v === 'none' ? null : v)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="직책 (Title)"><Input value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} className="h-11 md:h-10" /></Field>
        <Field label="직급 (Position)"><Input value={f.position} onChange={(e) => set('position', e.target.value)} className="h-11 md:h-10" /></Field>
        <Field label="연락처"><Input value={f.phone} onChange={(e) => set('phone', e.target.value)} className="h-11 md:h-10" /></Field>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-11 md:h-10">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        저장
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
