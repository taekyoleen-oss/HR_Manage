'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type Item = {
  id: string;
  kind: string;
  title: string;
  body: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationListClient({ items: initial }: { items: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);

  async function onClickItem(item: Item) {
    if (!item.read_at) {
      try {
        await fetch(`/api/notifications/${item.id}/read`, { method: 'POST' });
      } catch {
        // 무시
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, read_at: new Date().toISOString() } : i)),
      );
    }
    if (item.link_path) router.push(item.link_path);
  }

  async function onReadAll() {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch {
      // 무시
    }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at ?? now })));
    router.refresh();
  }

  const hasUnread = items.some((i) => !i.read_at);

  return (
    <div>
      {hasUnread && (
        <div className="px-4 py-2 border-b border-border flex justify-end">
          <Button variant="outline" size="sm" onClick={onReadAll}>모두 읽음으로 표시</Button>
        </div>
      )}
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onClickItem(item)}
              className={`w-full text-left px-4 py-3 hover:bg-muted ${item.read_at ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!item.read_at && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.body}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{formatDate(item.created_at)}</div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
