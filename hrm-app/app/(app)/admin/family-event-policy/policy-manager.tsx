'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogFooter,
  ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogTrigger,
} from '@/components/common/responsive-dialog';
import {
  RELATION_LABEL, FAMILY_EVENT_LABEL, USAGE_LIMIT_LABEL,
  type FamilyRelation, type FamilyEventKind, type FamilyEventUsageLimit,
} from '@/types/hrm';

type PolicyRow = {
  id: string;
  code: string;
  name: string;
  relation: FamilyRelation;
  event_kind: FamilyEventKind;
  granted_days: number;
  required_attachment_note: string | null;
  usage_limit: FamilyEventUsageLimit;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
};

export function PolicyManager({ initialPolicies }: { initialPolicies: PolicyRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PolicyRow | null>(null);
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    id: '' as string | undefined,
    code: '',
    name: '',
    relation: 'self' as FamilyRelation,
    eventKind: 'wedding' as FamilyEventKind,
    grantedDays: 1,
    requiredAttachmentNote: '',
    usageLimit: 'unlimited' as FamilyEventUsageLimit,
    description: '',
    isActive: true,
    sortOrder: 99,
  });

  function openNew() {
    setEditing(null);
    setForm({
      id: undefined, code: '', name: '',
      relation: 'self', eventKind: 'wedding',
      grantedDays: 1, requiredAttachmentNote: '',
      usageLimit: 'unlimited', description: '',
      isActive: true, sortOrder: 99,
    });
    setOpen(true);
  }

  function openEdit(p: PolicyRow) {
    setEditing(p);
    setForm({
      id: p.id,
      code: p.code,
      name: p.name,
      relation: p.relation as FamilyRelation,
      eventKind: p.event_kind as FamilyEventKind,
      grantedDays: Number(p.granted_days),
      requiredAttachmentNote: p.required_attachment_note ?? '',
      usageLimit: p.usage_limit as FamilyEventUsageLimit,
      description: p.description ?? '',
      isActive: p.is_active,
      sortOrder: p.sort_order,
    });
    setOpen(true);
  }

  function save() {
    if (!form.code.trim() || !form.name.trim()) return void toast.error('코드와 이름은 필수입니다');
    if (form.grantedDays < 0) return void toast.error('일수는 0 이상이어야 합니다');
    startTransition(async () => {
      const res = await fetch('/api/admin/family-event-policy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          code: form.code.trim(),
          name: form.name.trim(),
          relation: form.relation,
          eventKind: form.eventKind,
          grantedDays: form.grantedDays,
          requiredAttachmentNote: form.requiredAttachmentNote.trim() || null,
          usageLimit: form.usageLimit,
          description: form.description.trim() || null,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('저장 실패', { description: json?.error?.message });
      toast.success('저장되었습니다');
      setOpen(false);
      router.refresh();
    });
  }

  function toggleActive(p: PolicyRow) {
    startTransition(async () => {
      const res = await fetch('/api/admin/family-event-policy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          code: p.code,
          name: p.name,
          relation: p.relation,
          eventKind: p.event_kind,
          grantedDays: Number(p.granted_days),
          requiredAttachmentNote: p.required_attachment_note,
          usageLimit: p.usage_limit,
          description: p.description,
          isActive: !p.is_active,
          sortOrder: p.sort_order,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) return void toast.error('변경 실패');
      toast.success(p.is_active ? '비활성화' : '활성화');
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ResponsiveDialog open={open} onOpenChange={setOpen}>
          <ResponsiveDialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4" /> 신규 정책</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="sm:max-w-xl">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{editing ? '정책 수정' : '신규 정책'}</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>코드 (영문)</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="self_wedding" />
                </div>
                <div className="space-y-2">
                  <Label>표시명</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="본인 결혼" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>관계</Label>
                  <Select value={form.relation} onValueChange={(v) => setForm({ ...form, relation: v as FamilyRelation })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RELATION_LABEL) as FamilyRelation[]).map((k) => (
                        <SelectItem key={k} value={k}>{RELATION_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>사유</Label>
                  <Select value={form.eventKind} onValueChange={(v) => setForm({ ...form, eventKind: v as FamilyEventKind })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FAMILY_EVENT_LABEL) as FamilyEventKind[]).map((k) => (
                        <SelectItem key={k} value={k}>{FAMILY_EVENT_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>부여 일수</Label>
                  <Input type="number" min={0} step={0.5} value={form.grantedDays}
                    onChange={(e) => setForm({ ...form, grantedDays: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>사용 한도</Label>
                  <Select value={form.usageLimit} onValueChange={(v) => setForm({ ...form, usageLimit: v as FamilyEventUsageLimit })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(USAGE_LIMIT_LABEL) as FamilyEventUsageLimit[]).map((k) => (
                        <SelectItem key={k} value={k}>{USAGE_LIMIT_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>필수 첨부 안내 (선택)</Label>
                <Input value={form.requiredAttachmentNote}
                  onChange={(e) => setForm({ ...form, requiredAttachmentNote: e.target.value })}
                  placeholder="예: 청첩장, 사망진단서" />
              </div>
              <div className="space-y-2">
                <Label>설명 (선택)</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>정렬 순서</Label>
                  <Input type="number" value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 mt-7">
                  <span className="text-sm">활성</span>
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                </div>
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
              <th className="text-left py-2 px-2">코드</th>
              <th className="text-left py-2 px-2">이름</th>
              <th className="text-left py-2 px-2">관계 / 사유</th>
              <th className="text-right py-2 px-2">일수</th>
              <th className="text-left py-2 px-2">한도</th>
              <th className="text-left py-2 px-2">상태</th>
              <th className="text-right py-2 px-2">동작</th>
            </tr>
          </thead>
          <tbody>
            {initialPolicies.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-2 px-2 font-mono text-xs">{p.code}</td>
                <td className="py-2 px-2">{p.name}</td>
                <td className="py-2 px-2 text-muted-foreground">
                  {RELATION_LABEL[p.relation as FamilyRelation]} / {FAMILY_EVENT_LABEL[p.event_kind as FamilyEventKind]}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">{Number(p.granted_days)}일</td>
                <td className="py-2 px-2">{USAGE_LIMIT_LABEL[p.usage_limit as FamilyEventUsageLimit]}</td>
                <td className="py-2 px-2">
                  {p.is_active ? <Badge variant="outline" className="bg-success/10 text-success border-success/30">활성</Badge>
                    : <Badge variant="outline" className="bg-muted text-muted-foreground">비활성</Badge>}
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleActive(p)}><Power className="h-4 w-4" /></Button>
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
