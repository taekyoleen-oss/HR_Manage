import Link from 'next/link';
import { requireManagerOrAdmin } from '@/lib/auth/guards';
import { getDirectReports } from '@/lib/employees/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/empty-state';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const user = await requireManagerOrAdmin();
  const reports = await getDirectReports(user.employeeId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">우리 팀</h1>
        <p className="text-sm text-muted-foreground">부하 직원 {reports.length}명</p>
      </header>

      {reports.length === 0 ? (
        <EmptyState
          icon={Users}
          title="배정된 부하 직원이 없습니다"
          description="조직 관리에서 상급자 관계를 설정하면 여기 표시됩니다."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {reports.map((r) => {
            const dept = (r as { hrm_departments?: { name?: string } }).hrm_departments;
            return (
              <Link key={r.id} href={`/team/${r.id}`}>
                <Card className="hover:border-primary/40 transition-colors h-full">
                  <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={r.profile_image_url ?? undefined} alt={r.name_ko} />
                      <AvatarFallback>{r.name_ko.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{r.name_ko}</CardTitle>
                      <CardDescription className="truncate text-xs">{r.job_title ?? r.position ?? '직책 미지정'}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <div>{dept?.name ?? '부서 미지정'}</div>
                    <div className="truncate">{r.email}</div>
                    <div>입사 {r.hire_date}</div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
