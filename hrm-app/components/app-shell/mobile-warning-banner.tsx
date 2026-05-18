import { AlertCircle } from 'lucide-react';

export function MobileWarningBanner({ reason }: { reason: string }) {
  return (
    <div className="md:hidden mb-4 rounded-md border border-warning/30 bg-warning/10 p-3 flex gap-2 text-sm">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
      <div>
        <p className="font-medium text-warning">PC 사용 권장</p>
        <p className="text-foreground/80 mt-0.5">{reason} 모바일에서도 작동하지만 PC에서 더 효율적입니다.</p>
      </div>
    </div>
  );
}
