'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Pin } from 'lucide-react';
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
import { ANNOUNCEMENT_CATEGORY_LABEL, type AnnouncementCategory, type AnnouncementRow } from '@/types/hrm';

export function AnnouncementManager({ initialItems }: { initialItems: AnnouncementRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const empty = {
    id: undefined as string | undefined,
    title: '',
    body: '',
    category: 'general' as AnnouncementCategory,
    isPinned: false,
    isPublished: true,
    expiresAt: '',
  };
  const [form, setForm] = useState(empty);

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(item: AnnouncementRow) {
    setForm({
      id: item.id,
      title: item.title,
      body: item.body,
      category: item.category as AnnouncementCategory,
      isPinned: item.is_pinned,
      isPublished: item.is_published,
      expiresAt: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '',
    });
    setOpen(true);
  }

  function save() {
    if (!form.title.trim() || !form.body.trim()) return void toast.error('제목과 본문은 필수입니다');
    startTransition(async () => {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: form.id,
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          isPinned: form.isPinned,
          isPublished: form.isPublished,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
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
    if (!confirm('정말 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
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
            <Button onClick={openNew}><Plus className="h-4 w-4" /> 새 공지</Button>
          </ResponsiveDialogTrigger>
          <ResponsiveDialogContent className="sm:max-w-2xl">
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>{form.id ? '공지 수정' : '새 공지'}</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label>본문</Label>
                <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={10} maxLength={20000} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as AnnouncementCategory })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ANNOUNCEMENT_CATEGORY_LABEL) as AnnouncementCategory[]).map((k) => (
                        <SelectItem key={k} value={k}>{ANNOUNCEMENT_CATEGORY_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>만료일시 (선택)</Label>
                  <Input type="datetime-local" value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>옵션</Label>
                  <div className="space-y-1">
                    <label className="flex items-center justify-between text-sm rounded-md border border-border px-3 py-2">
                      상단 고정
                      <Switch checked={form.isPinned} onCheckedChange={(v) => setForm({ ...form, isPinned: v })} />
                    </label>
                    <label className="flex items-center justify-between text-sm rounded-md border border-border px-3 py-2">
                      게시
                      <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
                    </label>
                  </div>
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

      <ul className="divide-y divide-border">
        {initialItems.map((item) => (
          <li key={item.id} className="py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium flex items-center gap-2">
                {item.is_pinned && <Pin className="h-3.5 w-3.5 text-warning" />}
                {item.title}
                {!item.is_published && <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">비게시</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {ANNOUNCEMENT_CATEGORY_LABEL[item.category as AnnouncementCategory]}
                {' · '}{new Date(item.published_at).toLocaleString('ko-KR')}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
