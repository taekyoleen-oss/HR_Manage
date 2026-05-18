'use client';

import * as React from 'react';
import { useIsDesktop } from '@/lib/utils/use-media-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// 데스크탑 Dialog, 모바일 Sheet(bottom)로 자동 분기하는 wrapper.
// 모든 children API는 두 컴포넌트가 동일.

type Props = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function ResponsiveDialog({ open, onOpenChange, children }: Props) {
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children}
    </Sheet>
  );
}

type WithChildren = { children: React.ReactNode; className?: string };

export function ResponsiveDialogTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogTrigger {...props}>{children}</DialogTrigger>
  ) : (
    <SheetTrigger {...props}>{children}</SheetTrigger>
  );
}

export function ResponsiveDialogContent({ children, className }: WithChildren) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogContent className={className}>{children}</DialogContent>
  ) : (
    <SheetContent side="bottom" className={`max-h-[90vh] overflow-y-auto ${className ?? ''}`}>
      {children}
    </SheetContent>
  );
}

export function ResponsiveDialogHeader({ children, className }: WithChildren) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogHeader className={className}>{children}</DialogHeader>
  ) : (
    <SheetHeader className={className}>{children}</SheetHeader>
  );
}

export function ResponsiveDialogTitle({ children, className }: WithChildren) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogTitle className={className}>{children}</DialogTitle>
  ) : (
    <SheetTitle className={className}>{children}</SheetTitle>
  );
}

export function ResponsiveDialogDescription({ children, className }: WithChildren) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogDescription className={className}>{children}</DialogDescription>
  ) : (
    <SheetDescription className={className}>{children}</SheetDescription>
  );
}

export function ResponsiveDialogFooter({ children, className }: WithChildren) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DialogFooter className={className}>{children}</DialogFooter>
  ) : (
    <SheetFooter className={className}>{children}</SheetFooter>
  );
}
