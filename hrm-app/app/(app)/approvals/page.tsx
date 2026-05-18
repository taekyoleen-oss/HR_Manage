import { requireManagerOrAdmin } from '@/lib/auth/guards';
import { getApprovalsQueue } from '@/lib/leave/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/empty-state';
import { ApprovalActions } from './approval-actions';
import { Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
  const user = await requireManagerOrAdmin();
  const rows = await getApprovalsQueue(user.employeeId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">결재함</h1>
        <p className="text-sm text-muted-foreground">대기 중인 휴가 신청을 처리하세요.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>대기 {rows.length}건</CardTitle>
          <CardDescription>오래된 신청 순으로 표시</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="대기 중인 결재가 없습니다"
              description="새 휴가 신청이 들어오면 여기 표시됩니다."
            />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const emp = (r as { hrm_employees?: { name_ko?: string; email?: string } }).hrm_employees;
                return (
                  <li key={r.id} className="py-3 md:py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {emp?.name_ko ?? '직원'} · {r.hrm_leave_types?.name ?? '휴가'}
                      </div>
                      <div className="mt-1 text-sm">
                        {r.start_date} ~ {r.end_date} · {Number(r.total_days).toFixed(1)}일
                      </div>
                      {r.reason && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">사유: {r.reason}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">신청 {formatDate(r.created_at)}</div>
                    </div>
                    <ApprovalActions
                      requestId={r.id}
                      employeeName={emp?.name_ko ?? '직원'}
                      summary={`${r.hrm_leave_types?.name ?? '휴가'} ${r.start_date}~${r.end_date}`}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
