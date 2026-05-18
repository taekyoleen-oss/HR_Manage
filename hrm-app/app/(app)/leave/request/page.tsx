import { requireUser } from '@/lib/auth/guards';
import { getActiveLeaveTypes, getMyLeaveBalance } from '@/lib/leave/queries';
import { LeaveRequestForm } from './leave-request-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function LeaveRequestPage() {
  const user = await requireUser();
  const year = new Date().getFullYear();
  const [types, balance] = await Promise.all([
    getActiveLeaveTypes(),
    getMyLeaveBalance(user.employeeId, year),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">휴가 신청</h1>
        <p className="text-sm text-muted-foreground">
          잔여 연차 {Number(balance?.remaining_days ?? 0).toFixed(1)}일 · 승인 대기 {Number(balance?.pending_days ?? 0).toFixed(1)}일
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>신청 내용</CardTitle>
          <CardDescription>휴가 유형, 기간을 입력하고 제출하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestForm leaveTypes={types} />
        </CardContent>
      </Card>
    </div>
  );
}
