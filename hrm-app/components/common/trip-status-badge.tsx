import { Badge } from '@/components/ui/badge';
import type { BusinessTripStatus, RemoteWorkStatus } from '@/types/hrm';

const TRIP_MAP: Record<BusinessTripStatus, { label: string; className: string }> = {
  pending: { label: '결재 대기', className: 'bg-warning/10 text-warning border-warning/30' },
  approved: { label: '승인', className: 'bg-success/10 text-success border-success/30' },
  rejected: { label: '반려', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  cancelled: { label: '취소', className: 'bg-muted text-muted-foreground border-border' },
  in_progress: { label: '출장 중', className: 'bg-primary/10 text-primary border-primary/30' },
  completed: { label: '완료', className: 'bg-success/10 text-success border-success/30' },
};

const REMOTE_MAP: Record<RemoteWorkStatus, { label: string; className: string }> = {
  pending: { label: '결재 대기', className: 'bg-warning/10 text-warning border-warning/30' },
  approved: { label: '승인', className: 'bg-success/10 text-success border-success/30' },
  rejected: { label: '반려', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  cancelled: { label: '취소', className: 'bg-muted text-muted-foreground border-border' },
};

export function TripStatusBadge({ status }: { status: BusinessTripStatus }) {
  const m = TRIP_MAP[status];
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>;
}

export function RemoteWorkStatusBadge({ status }: { status: RemoteWorkStatus }) {
  const m = REMOTE_MAP[status];
  return <Badge variant="outline" className={m.className}>{m.label}</Badge>;
}
