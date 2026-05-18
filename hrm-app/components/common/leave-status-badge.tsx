import { Badge } from '@/components/ui/badge';
import type { LeaveRequestStatus } from '@/types/hrm';

const MAP: Record<LeaveRequestStatus, { label: string; className: string }> = {
  pending: { label: '승인 대기', className: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/15' },
  approved: { label: '승인됨', className: 'bg-success/10 text-success border-success/30 hover:bg-success/15' },
  rejected: { label: '반려', className: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15' },
  cancelled: { label: '취소됨', className: 'bg-muted text-muted-foreground border-border' },
  system_cancelled: { label: '자동 취소', className: 'bg-muted text-muted-foreground border-border' },
};

export function LeaveStatusBadge({ status }: { status: LeaveRequestStatus }) {
  const m = MAP[status];
  return (
    <Badge variant="outline" className={m.className}>
      {m.label}
    </Badge>
  );
}
