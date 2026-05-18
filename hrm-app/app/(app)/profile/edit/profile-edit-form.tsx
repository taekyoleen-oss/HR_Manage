'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type Initial = {
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  smsOptIn: boolean;
};

export function ProfileEditForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Initial>(initial);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch('/api/employees/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(state),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('저장 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('저장되었습니다');
      router.push('/profile');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">연락처</Label>
        <Input id="phone" value={state.phone} onChange={(e) => set('phone', e.target.value)} className="h-11 md:h-10" placeholder="010-1234-5678" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">주소</Label>
        <Textarea id="address" value={state.address} onChange={(e) => set('address', e.target.value)} rows={2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="emName">비상 연락처 이름</Label>
          <Input id="emName" value={state.emergencyContactName} onChange={(e) => set('emergencyContactName', e.target.value)} className="h-11 md:h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emRel">관계</Label>
          <Input id="emRel" value={state.emergencyContactRelation} onChange={(e) => set('emergencyContactRelation', e.target.value)} className="h-11 md:h-10" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emPhone">비상 연락처 전화번호</Label>
        <Input id="emPhone" value={state.emergencyContactPhone} onChange={(e) => set('emergencyContactPhone', e.target.value)} className="h-11 md:h-10" />
      </div>

      <div className="rounded-md border border-border p-4 flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="smsOptIn" className="text-base">SMS 알림 받기</Label>
          <p className="text-xs text-muted-foreground mt-1">
            결재 요청·승인·반려가 발생하면 등록된 연락처로 SMS를 받습니다. 인앱 알림은 기본으로 항상 옵니다.
          </p>
        </div>
        <Switch
          id="smsOptIn"
          checked={state.smsOptIn}
          onCheckedChange={(checked) => set('smsOptIn', checked)}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full h-11 md:h-10">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        저장
      </Button>
    </form>
  );
}
