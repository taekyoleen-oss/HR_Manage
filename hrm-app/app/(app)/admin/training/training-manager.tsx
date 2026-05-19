'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogFooter,
  ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';

type Employee = { id: string; name: string; employeeNo: string };
type Record = {
  id: string;
  employee_id: string;
  title: string;
  provider: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  cost: number | null;
  certificate_url: string | null;
  notes: string | null;
  hrm_employees?: { name_ko?: string } | null;
};

export function TrainingManager({
  employees, initialRecords,
}: { employees: Employee[]; initialRecords: Record[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const empty = {
    id: undefined as string | undefined,
    employeeId: employees[0]?.id ?? '',
    title: '',
    provider: '',
    category: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    hours: '',
    cost: '',
    certificateUrl: '',
    notes: '',
  };
  const [form, setForm] = useState(empty);

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(r: Record) {
    setForm({
      id: r.id,
      employeeId: r.employee_id,
      title: r.title,
      provider: r.provider ?? '',
      category: r.category ?? '',
      startDate: r.start_date,
      endDate: r.end_date ?? '',
      hours: r.hours != null ? String(r.hours) : '',
      cost: r.cost != null ? String(r.cost) : '',
      certificateUrl: r.certificate_url ?? '',
      notes: r.notes ?? '',
    });
    setOpen(true);
  }

  function save() {
    if (!form.title.trim() || !form.employeeId) return void toast.error('직원과 교육명을 입력하세요');
    startTransition(async () => {
      const res = await fetch('/api/admin/training', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          employeeId: form.employeeId,
          title: form.title.trim(),
          provider: form.provider.trim() || null,
          category: form.category.trim() || null,
          startDate: form.startDate,
          endDate: form.endDate || null,
          hours: form.hours ? Number(form.hours) : null,
          cost: form.cost ? Number(form.cost) : null,
          certificateUrl: form.certificateUrl.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('저장 실패', { description: json?.error?.message });
      toast.success('저장되었습니다');
      setOpen(false);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/training?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('삭제 실패');
      toast.success('삭제되었습니다');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
          <ResponsiveDialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> 교육 추가</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="sm:max-w-xl">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{form.id ? '교육 수정' : '새 교육 이력'}</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>직원</Label>
                  <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeNo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>카테고리 (선택)</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="직무/리더십/법정/안전" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>교육명</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>제공처 (선택)</Label>
                <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="사내, 외부 기관명" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>종료일 (선택)</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} min={form.startDate} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>이수 시간 (선택)</Label>
                  <Input type="number" step={0.5} min={0} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>비용 (원, 선택)</Label>
                  <Input type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>수료증 URL (선택)</Label>
                <Input type="url" value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>비고 (선택)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <ResponsiveDialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
              <Button onClick={save} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} 저장
              </Button>
            </ResponsiveDialogFooter>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-2 px-2">직원</th>
              <th className="text-left py-2 px-2">교육명</th>
              <th className="text-left py-2 px-2">카테고리</th>
              <th className="text-left py-2 px-2">기간</th>
              <th className="text-right py-2 px-2">시간</th>
              <th className="text-right py-2 px-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {initialRecords.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">아직 등록된 이력이 없습니다.</td></tr>
            )}
            {initialRecords.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-2 px-2">{r.hrm_employees?.name_ko ?? r.employee_id.slice(0, 6)}</td>
                <td className="py-2 px-2">{r.title}{r.provider ? <span className="text-muted-foreground"> · {r.provider}</span> : null}</td>
                <td className="py-2 px-2 text-muted-foreground">{r.category ?? ''}</td>
                <td className="py-2 px-2">{r.start_date}{r.end_date ? ` ~ ${r.end_date}` : ''}</td>
                <td className="py-2 px-2 text-right tabular-nums">{r.hours ?? ''}</td>
                <td className="py-2 px-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
