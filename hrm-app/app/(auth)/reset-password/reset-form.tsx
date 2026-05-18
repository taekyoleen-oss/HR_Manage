'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        toast.error('전송 실패', { description: error.message });
        return;
      }
      setSent(true);
      toast.success('전송 완료', { description: '이메일을 확인하세요.' });
    });
  }

  if (sent) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 p-4 text-sm">
        <p className="font-medium text-success">이메일 전송 완료</p>
        <p className="text-muted-foreground mt-1">
          메일함을 확인해 링크로 비밀번호를 재설정하세요. 도착하지 않으면 스팸함도 확인해주세요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 md:h-10"
        />
      </div>
      <Button type="submit" className="w-full h-11 md:h-10" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        재설정 링크 보내기
      </Button>
    </form>
  );
}
