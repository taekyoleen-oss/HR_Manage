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

export function EmployeeCreateForm({ departments, managers }: { departments: Option[]; managers: Option[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    email: '',
    nameKo: '',
    nameEn: '',
    employeeNo: '',
    role: 'employee' as Role,
    employmentType: 'regular' as Type,
    departmentId: '',
    managerId: '',
    jobTitle: '',
    position: '',
    hireDate: new Date().toISOString().slice(0, 10),
    phone: '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId || null,
          managerId: form.managerId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('등록 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('직원이 등록되었습니다');
      router.push('/admin/employees');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="이름 (한)" required>
          <Input value={form.nameKo} onChange={(e) => set('nameKo', e.target.value)} className="h-11 md:h-10" required />
        </Field>
        <Field label="이름 (영)">
          <Input value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} className="h-11 md:h-10" />
        </Field>
        <Field label="이메일" required>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="h-11 md:h-10" required />
        </Field>
        <Field label="사번">
          <Input value={form.employeeNo} onChange={(e) => set('employeeNo', e.target.value)} className="h-11 md:h-10" />
        </Field>
        <Field label="입사일" required>
          <Input type="date" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)} className="h-11 md:h-10" required />
        </Field>
        <Field label="연락처">
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="h-11 md:h-10" />
        </Field>
        <Field label="권한">
          <Select value={form.role} onValueChange={(v) => set('role', v as Role)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="고용 형태">
          <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v as Type)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="부서">
          <Select value={form.departmentId || 'none'} onValueChange={(v) => set('departmentId', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">미지정</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="상급자">
          <Select value={form.managerId || 'none'} onValueChange={(v) => set('managerId', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="직책 (Title)">
          <Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} className="h-11 md:h-10" />
        </Field>
        <Field label="직급 (Position)">
          <Input value={form.position} onChange={(e) => set('position', e.target.value)} className="h-11 md:h-10" />
        </Field>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-11 md:h-10">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        등록 및 초대 메일 발송
      </Button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}
