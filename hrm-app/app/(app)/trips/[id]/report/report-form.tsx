'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function ReportForm({ tripId, initialReport }: { tripId: string; initialReport: string }) {
  const router = useRouter();
  const [report, setReport] = useState(initialReport);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (report.trim().length < 10) {
      toast.error('보고서는 최소 10자 이상이어야 합니다');
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/trips/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId: tripId, report: report.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('제출 실패', { description: json?.error?.message });
        return;
      }
      toast.success('복귀 보고가 완료되었습니다');
      router.push(`/trips/${tripId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="report">보고서 본문</Label>
        <Textarea
          id="report"
          value={report}
          onChange={(e) => setReport(e.target.value)}
          rows={12}
          maxLength={5000}
          placeholder={`주요 일정\n주요 성과\n후속 조치\n비용 요약 (선택)`}
          required
        />
        <p className="text-xs text-muted-foreground text-right">{report.length}/5000</p>
      </div>
      <Button type="submit" className="w-full h-11 md:h-10" disabled={pending || report.trim().length < 10}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        보고서 제출 및 완료 처리
      </Button>
    </form>
  );
}
