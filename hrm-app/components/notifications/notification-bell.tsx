'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState<number>(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
      const json = await res.json();
      if (json?.ok) setUnread(json.data.unreadCount ?? 0);
    } catch {
      // 무시
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10', { cache: 'no-store' });
      const json = await res.json();
      if (json?.ok) setItems(json.data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUnreadCount();
    const t = setInterval(() => void fetchUnreadCount(), POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchUnreadCount]);

  // 드롭다운이 열릴 때 목록 fetch
  useEffect(() => {
    if (open) void fetchList();
  }, [open, fetchList]);

  async function handleClickItem(item: NotificationItem) {
    setOpen(false);
    if (!item.read_at) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: 'POST' });
      } catch {
        // 무시 — 페이지 이동이 더 중요
      }
      setUnread((n) => Math.max(0, n - 1));
    }
    if (item.link_path) {
      router.push(item.link_path);
    }
  }

  async function handleReadAll() {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      // 무시
    }
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10" aria-label="알림">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-4 text-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-medium">알림</span>
          {unread > 0 && (
            <button
              onClick={handleReadAll}
              className="text-xs text-primary hover:underline"
            >
              모두 읽음
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              알림이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleClickItem(item)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-muted ${item.read_at ? 'opacity-70' : 'bg-primary/[0.03]'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read_at && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.body}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {formatRelative(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-3 py-2 text-center">
          <Link href="/notifications" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">
            전체 알림 보기
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
