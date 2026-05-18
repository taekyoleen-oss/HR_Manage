---
name: tweakcn-component-customizer
description: shadcn/ui 컴포넌트에 TweakCN 토큰을 적용해 HRM의 Clean Corporate 톤으로 커스터마이징하는 스킬. 라운딩, 폰트 weight, 모바일 터치 영역, 휴가 상태 variant를 일관되게 정의한다.
---

# tweakcn-component-customizer

## 목적
`npx shadcn@latest add`로 추가한 기본 컴포넌트에 설계서 4.4의 커스터마이징 규칙을 일괄 적용한다.

## 입력
- 컴포넌트명 (예: `Button`, `Card`, `Input`, `Table`, `Dialog`, `Sheet`, ...)
- 데스크탑/모바일 변형 요구사항

## 출력
- 수정된 `components/ui/<name>.tsx`
- 필요 시 `class-variance-authority` variant 추가

## 컴포넌트별 표준 커스터마이징

### Button
```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-white hover:bg-success/90',     // 승인
        warning: 'bg-warning text-white hover:bg-warning/90',     // 대기/주의
      },
      size: {
        default: 'h-10 px-4 py-2 md:h-10 h-12',  // 모바일 48px
        sm: 'h-9 px-3 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 md:h-10 h-12 w-12',     // 터치 영역
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

### Card
```tsx
<div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm p-6 md:p-6 p-4" />
// 데스크탑 padding 24px, 모바일 16px
```

### Input
```tsx
<input className="flex h-10 md:h-10 h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive" />
```

### Badge — 휴가 상태 variant
```tsx
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-success/10 text-success border-success/20',         // 승인됨
        warning: 'bg-warning/10 text-warning border-warning/20',         // 승인 대기
        destructive: 'bg-destructive/10 text-destructive border-destructive/20', // 반려
        muted: 'bg-muted text-muted-foreground border-border',           // 취소됨
      },
    },
  }
);
```

### Sheet (모바일 풀스크린)
```tsx
// 모바일에서 풀폭, side='bottom' 기본
<SheetContent side="bottom" className="h-[90vh] md:h-auto md:max-w-lg" />
```

### Dialog + Sheet ResponsiveDialog wrapper
```tsx
// components/common/responsive-dialog.tsx
'use client';
import { useMediaQuery } from '@/lib/utils/use-media-query';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export function ResponsiveDialog({ children, ...props }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  if (isDesktop) return <Dialog {...props}>{children}</Dialog>;
  return <Sheet {...props}>{children}</Sheet>;
}
```

### Toast (Sonner)
```tsx
// app/layout.tsx
<Toaster
  position="top-right"
  toastOptions={{
    classNames: {
      toast: 'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border',
      success: 'group-[.toaster]:bg-success group-[.toaster]:text-white',
      error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-white',
    },
  }}
/>
// 모바일: position='top-center' 또는 풀폭
```

### DataTable (모바일 카드 전환)
`components/ui/data-table.tsx`에 `mobileCardRenderer` prop 추가:
```tsx
<DataTable
  columns={columns}
  data={data}
  mobileCardRenderer={(row) => (
    <div className="rounded-lg border p-4">
      <div className="font-medium">{row.name}</div>
      <div className="text-muted-foreground text-sm">{row.email}</div>
    </div>
  )}
/>
```

## 적용 체크리스트
1. [ ] shadcn 기본 컴포넌트 추가 후 즉시 hex 색상을 토큰 클래스로 치환
2. [ ] 라운딩 `rounded-md` 또는 `rounded-lg` 통일
3. [ ] 모바일에서 터치 영역 ≥ 44px (Button, Checkbox, Icon button)
4. [ ] focus ring 가시성 확인 (`focus-visible:ring-2 focus-visible:ring-ring`)
5. [ ] 다크 모드 대응 클래스는 v2.0에서 — 현재는 라이트만

## 금지 사항
- `style={{ color: '#...' }}` 인라인 hex
- `bg-[#2563EB]` Tailwind 임의값 색상
- 라운딩 일관성 없는 사용 (`rounded-xl`, `rounded-sm` 혼용)
- 모바일 변형 없이 데스크탑만 작성
