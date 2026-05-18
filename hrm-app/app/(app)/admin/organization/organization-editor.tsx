'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Option = { id: string; name: string };
type Row = { id: string; name: string; departmentId: string | null; managerId: string | null };

export function OrganizationEditor({
  employees,
  departments,
  managers,
}: {
  employees: Row[];
  departments: Option[];
  managers: Option[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(employees);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(id: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function save(row: Row) {
    setSavingId(row.id);
    startTransition(async () => {
      const res = await fetch('/api/admin/organization', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          employeeId: row.id,
          departmentId: row.departmentId,
          managerId: row.managerId,
        }),
      });
      const json = await res.json();
      setSavingId(null);
      if (!res.ok || !json.ok) {
        toast.error('저장 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success(`${row.name} 저장됨`);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">직원</th>
            <th className="px-3 py-2 font-medium">부서</th>
            <th className="px-3 py-2 font-medium">상급자</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2">
                <Select value={r.departmentId ?? 'none'} onValueChange={(v) => update(r.id, { departmentId: v === 'none' ? null : v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미지정</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2">
                <Select value={r.managerId ?? 'none'} onValueChange={(v) => update(r.id, { managerId: v === 'none' ? null : v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">없음</SelectItem>
                    {managers.filter((m) => m.id !== r.id).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2 text-right">
                <Button size="sm" variant="outline" disabled={pending && savingId === r.id} onClick={() => save(r)}>
                  {pending && savingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  저장
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
