'use client';

import { useEffect, useState } from 'react';

// SSR에서는 window가 없으므로 항상 initialState를 반환.
// useEffect에서 실제 미디어쿼리로 업데이트.
// hydration mismatch를 피하려면 SSR+첫 CSR 렌더가 동일해야 하므로,
// 호출부는 `mounted` 플래그도 함께 활용하는 것을 권장한다.
export function useMediaQuery(query: string, initialState = false): {
  matches: boolean;
  mounted: boolean;
} {
  const [matches, setMatches] = useState(initialState);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    setMounted(true);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return { matches, mounted };
}

// 데스크탑 기본값(true)으로 첫 렌더 — HRM은 PC 중심. 모바일은 mount 후 자동 전환.
// 호출부 단순화를 위해 boolean만 반환하는 wrapper도 같이 제공.
export function useIsDesktop(): boolean {
  const { matches, mounted } = useMediaQuery('(min-width: 768px)', true);
  // mount 전엔 desktop 가정 (SSR과 동일) → hydration 안전.
  return mounted ? matches : true;
}

export function useIsMobile(): boolean {
  return !useIsDesktop();
}
