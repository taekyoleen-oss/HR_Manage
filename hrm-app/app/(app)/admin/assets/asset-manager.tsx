'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogFooter,
  ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';
import { ASSET_STATUS_LABEL, type AssetStatus } from '@/types/hrm';

type Employee = { id: string; name: string; employeeNo: string };
type Asset = {
  id: string;
  asset_no: string;
  category: string;
  name: string;
  serial_no: string | null;
  purchased_at: string | null;
  purchase_price: number | null;
  status: AssetStatus;
  current_assignee_id: string | null;
  current_assigned_at: string | null;
  notes: string | null;
  hrm_employees?: { name_ko?: string } | null;
};

const STATUS_COLOR: Record<AssetStatus, string> = {
  available: 'bg-success/10 text-success border-success/30',
  assigned: 'bg-primary/10 text-primary border-primary/30',
  in_repair: 'bg-warning/10 text-warning border-warning/30',
  retired: 'bg-muted text-muted-foreground border-border',
};

export function AssetManager({ initialAssets, employees }: { initialAssets: Asset[]; employees: Employee[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [pending, startTransition] = useTransition();

  const empty = {
    id: undefined as string | undefined,
    assetNo: '',
    category: 'laptop',
    name: '',
    serialNo: '',
    purchasedAt: '',
    purchasePrice: '',
    status: 'available' as AssetStatus,
    notes: '',
  };
  const [form, setForm] = useState(empty);

  const [assignEmpId, setAssignEmpId] = useState(employees[0]?.id ?? '');
  const [assignCondition, setAssignCondition] = useState('');
  const [returnCondition, setReturnCondition] = useState('');

  function openNew() { setForm(empty); setEditOpen(true); }
  function openEdit(a: Asset) {
    setForm({
      id: a.id,
      assetNo: a.asset_no,
      category: a.category,
      name: a.name,
      serialNo: a.serial_no ?? '',
      purchasedAt: a.purchased_at ?? '',
      purchasePrice: a.purchase_price != null ? String(a.purchase_price) : '',
      status: a.status,
      notes: a.notes ?? '',
    });
    setEditOpen(true);
  }

  function save() {
    if (!form.assetNo.trim() || !form.name.trim()) return void toast.error('자산번호와 이름은 필수');
    startTransition(async () => {
      const res = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          assetNo: form.assetNo.trim(),
          category: form.category.trim(),
          name: form.name.trim(),
          serialNo: form.serialNo.trim() || null,
          purchasedAt: form.purchasedAt || null,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
          status: form.status,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('저장 실패', { description: json?.error?.message });
      toast.success('저장되었습니다');
      setEditOpen(false);
      router.refresh();
    });
  }

  function openAssign(a: Asset) {
    setActiveAsset(a);
    setAssignEmpId(employees[0]?.id ?? '');
    setAssignCondition('');
    setAssignOpen(true);
  }
  function doAssign() {
    if (!activeAsset || !assignEmpId) return;
    startTransition(async () => {
      const res = await fetch('/api/admin/assets/assign?action=assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          assetId: activeAsset.id,
          employeeId: assignEmpId,
          conditionOnAssign: assignCondition.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('배정 실패', { description: json?.error?.message });
      toast.success('배정되었습니다');
      setAssignOpen(false);
      router.refresh();
    });
  }

  function openReturn(a: Asset) {
    setActiveAsset(a);
    setReturnCondition('');
    setReturnOpen(true);
  }
  function doReturn() {
    if (!activeAsset) return;
    startTransition(async () => {
      const res = await fetch('/api/admin/assets/assign?action=return', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          assetId: activeAsset.id,
          conditionOnReturn: returnCondition.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('반납 실패');
      toast.success('반납 처리되었습니다');
      setReturnOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="h-4 w-4" /> 자산 추가</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-2 px-2">자산번호</th>
              <th className="text-left py-2 px-2">분류</th>
              <th className="text-left py-2 px-2">모델</th>
              <th className="text-left py-2 px-2">상태</th>
              <th className="text-left py-2 px-2">현재 사용자</th>
              <th className="text-right py-2 px-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {initialAssets.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">자산이 없습니다.</td></tr>
            )}
            {initialAssets.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="py-2 px-2 font-mono text-xs">{a.asset_no}</td>
                <td className="py-2 px-2 text-muted-foreground">{a.category}</td>
                <td className="py-2 px-2">{a.name}{a.serial_no ? <span className="text-xs text-muted-foreground"> · {a.serial_no}</span> : null}</td>
                <td className="py-2 px-2">
                  <Badge variant="outline" className={STATUS_COLOR[a.status]}>{ASSET_STATUS_LABEL[a.status]}</Badge>
                </td>
                <td className="py-2 px-2">{a.hrm_employees?.name_ko ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="py-2 px-2 text-right">
                  <div className="flex gap-1 justify-end">
                    {a.status === 'available' && (
                      <Button variant="ghost" size="icon" title="배정" onClick={() => openAssign(a)}><ArrowRightLeft className="h-4 w-4" /></Button>
                    )}
                    {a.status === 'assigned' && (
                      <Button variant="ghost" size="icon" title="반납" onClick={() => openReturn(a)}><RotateCcw className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResponsiveDialog open={editOpen} onOpenChange={setEditOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{form.id ? '자산 수정' : '새 자산'}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>자산번호</Label>
                <Input value={form.assetNo} onChange={(e) => setForm({ ...form, assetNo: e.target.value })} placeholder="NB-2024-001" />
              </div>
              <div className="space-y-2">
                <Label>분류</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="laptop, monitor, phone, ..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>모델명</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="MacBook Pro 14 M3" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>시리얼 (선택)</Label>
                <Input value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>상태</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AssetStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ASSET_STATUS_LABEL) as AssetStatus[]).map((k) => (
                      <SelectItem key={k} value={k}>{ASSET_STATUS_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>구입일</Label>
                <Input type="date" value={form.purchasedAt} onChange={(e) => setForm({ ...form, purchasedAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>구입가 (원)</Label>
                <Input type="number" min={0} value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>비고</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>취소</Button>
            <Button onClick={save} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} 저장
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={assignOpen} onOpenChange={setAssignOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>자산 배정 — {activeAsset?.name}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>배정 직원</Label>
              <Select value={assignEmpId} onValueChange={setAssignEmpId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeNo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>배정 시 상태 (선택)</Label>
              <Textarea value={assignCondition} onChange={(e) => setAssignCondition(e.target.value)} rows={2} placeholder="예: 새 제품, 액세서리 일체" />
            </div>
          </div>
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>취소</Button>
            <Button onClick={doAssign} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} 배정
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      <ResponsiveDialog open={returnOpen} onOpenChange={setReturnOpen}>
        <ResponsiveDialogContent className="sm:max-w-md">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>자산 반납 — {activeAsset?.name}</ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <div className="space-y-2">
            <Label>반납 시 상태 (선택)</Label>
            <Textarea value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} rows={3} placeholder="예: 정상 작동, 키보드 일부 마모" />
          </div>
          <ResponsiveDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReturnOpen(false)}>취소</Button>
            <Button onClick={doReturn} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} 반납 처리
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
