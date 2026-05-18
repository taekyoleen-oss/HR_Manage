---
name: mobile-responsive-checker
description: v1.1 신규. 신규/변경된 페이지의 모바일 렌더링과 터치 영역, 자동 전환 패턴(Dialog→Sheet, Table→Card) 적용을 점검하는 스킬. 375px·390px·768px 브레이크포인트를 기준으로 체크리스트를 실행한다.
---

# mobile-responsive-checker (v1.1)

## 목적
모든 페이지/컴포넌트가 모바일에서도 핵심 기능을 사용할 수 있는지 자동 점검한다. 설계서 4.5의 반응형 전략을 준수하는지 검증.

## 입력
- 점검 대상 파일 경로 (페이지 또는 컴포넌트)
- 페이지 유형 (모바일 풀 기능 / PC 권장)

## 출력
- 체크리스트 결과 (통과/실패 + 위치)
- 위반 항목별 수정 제안
- 통과 시 "OK" 보고

## 점검 항목

### 1) 절대 금지 패턴 (코드 grep)
| 패턴 | 사유 |
|------|------|
| `min-w-\[1[0-9]{3}px\]` | 모바일에서 가로 스크롤 강제 |
| `style="width: 1` | 인라인 고정 폭 |
| `class.*\bw-\[(\d{3,})px\]` | 절대 px 폭 (200px+) |
| `Dialog` 단독 사용 (Sheet 분기 없이) | 모바일에서 작은 모달 발생 |
| `table` 직접 사용 + 컬럼 5개+ + 카드 분기 없음 | 모바일 가독성 ↓ |

### 2) 필수 패턴
| 패턴 | 위치 |
|------|------|
| `useMediaQuery` 또는 `md:`/`lg:` 분기 | 데스크탑 우선 컴포넌트 |
| `ResponsiveDialog` 사용 (긴 폼) | Dialog 대신 |
| Button `h-10 md:h-10 h-12` 또는 size 적용 | 터치 영역 |
| `<MobileBottomNav>` 포함 | `(app)/layout.tsx` |
| `<MobileWarningBanner>` | `/admin/employees/new`, `/admin/organization` |

### 3) 페이지별 모바일 풀 기능 검증

다음 페이지는 모바일에서 풀 기능 동작해야 한다:

| 페이지 | 핵심 검증 |
|-------|---------|
| `/dashboard` | 카드 1열 스택, 잔여연차/결재 대기 표시 |
| `/approvals` | `ApprovalCard` 사용, 승인/반려 버튼 큰 사이즈 |
| `/leave/request` | Sheet 풀스크린, 단계별 입력 가능 |
| `/leave/history` | 카드 리스트 + 취소 버튼 |
| `/leave` | 캘린더 → 주간 뷰 또는 리스트 뷰 fallback |
| `/team` | 카드 그리드 1열 |
| `/admin/employees` | 카드 리스트 + sticky 검색 |
| `/admin/leave-overview` | 차트 세로 스택 + 스크롤 |

### 4) 터치 영역
- 모든 클릭/탭 가능 요소: 최소 44×44px
- 인접 인터랙티브 요소 간격 최소 8px

### 5) 폰트 크기
- 본문 최소 14px (모바일 16px 권장)
- placeholder 본문보다 작지 않게

## 실행 방법

```bash
# 1) 정적 패턴 검사
grep -rn 'min-w-\[1[0-9]\{3\}px\]' app/ components/

# 2) Dialog 사용처에 ResponsiveDialog 또는 Sheet 분기 확인
grep -rn 'from "@/components/ui/dialog"' app/ components/ | while read line; do
  file=$(echo $line | cut -d: -f1)
  if ! grep -q 'useMediaQuery\|ResponsiveDialog\|Sheet' $file; then
    echo "WARN: $file - Dialog without mobile fallback"
  fi
done

# 3) 필수 컴포넌트 존재
test -f components/app-shell/mobile-bottom-nav.tsx
test -f components/app-shell/mobile-warning-banner.tsx
test -f components/common/responsive-dialog.tsx
test -f lib/utils/use-media-query.ts
```

## 실패 시 폴백

| 위반 | 폴백 |
|------|------|
| 복잡한 차트가 모바일에서 렌더 깨짐 | 테이블 뷰로 자동 전환 |
| 캘린더 월별 뷰 좁음 | 주간 뷰 또는 리스트 뷰 |
| 드래그앤드롭 사용 불가 | 선택 → 드롭다운 모드로 fallback |
| 폼 입력 효율 낮음 | `<MobileWarningBanner>` + 단계별 폼 |

## 보고 포맷

```
[mobile-responsive-checker] 점검 결과

✅ 통과: 12개 페이지
⚠️ 경고: 2개
   - app/(app)/admin/leave-policy/page.tsx — Dialog 단독 사용 (ResponsiveDialog 권장)
   - components/leave/leave-calendar.tsx — 모바일 < 768px 폴백 없음

✗ 실패: 0개
```

## 금지 사항
- 데스크탑만 작성하고 "추후 모바일 대응" 보고
- PC 권장 페이지에 배너 누락
