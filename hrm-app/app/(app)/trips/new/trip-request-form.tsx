'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TRIP_TYPE_LABEL, TRIP_TRANSPORT_LABEL,
  type BusinessTripType, type BusinessTripTransport,
} from '@/types/hrm';

type Colleague = { id: string; name: string; employeeNo: string };

export function TripRequestForm({ colleagues }: { colleagues: Colleague[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tripType, setTripType] = useState<BusinessTripType>('domestic');
  const [purpose, setPurpose] = useState('');
  const [country, setCountry] = useState('대한민국');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transportation, setTransportation] = useState<BusinessTripTransport>('flight');
  const [accommodation, setAccommodation] = useState('');
  const [accompanyingIds, setAccompanyingIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  function toggleAccompany(id: string) {
    setAccompanyingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!purpose.trim()) return void toast.error('출장 목적을 입력하세요');
    if (!country.trim()) return void toast.error('목적지 국가를 입력하세요');
    if (!startDate || !endDate) return void toast.error('출장 기간을 입력하세요');
    if (startDate > endDate) return void toast.error('시작일이 종료일보다 늦습니다');

    startTransition(async () => {
      const res = await fetch('/api/trips/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tripType,
          purpose: purpose.trim(),
          destinationCountry: country.trim(),
          destinationCity: city.trim() || null,
          startDate,
          endDate,
          transportation,
          accommodation: accommodation.trim() || null,
          accompanyingEmployeeIds: accompanyingIds,
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error('신청 실패', { description: json?.error?.message ?? `상태 ${res.status}` });
        return;
      }
      toast.success('출장 신청이 접수되었습니다');
      router.push('/trips');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="tripType">출장 구분</Label>
          <Select value={tripType} onValueChange={(v) => setTripType(v as BusinessTripType)}>
            <SelectTrigger id="tripType" className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="domestic">{TRIP_TYPE_LABEL.domestic}</SelectItem>
              <SelectItem value="overseas">{TRIP_TYPE_LABEL.overseas}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportation">교통수단</Label>
          <Select value={transportation} onValueChange={(v) => setTransportation(v as BusinessTripTransport)}>
            <SelectTrigger id="transportation" className="h-11 md:h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(TRIP_TRANSPORT_LABEL) as BusinessTripTransport[]).map((k) => (
                <SelectItem key={k} value={k}>{TRIP_TRANSPORT_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">출장 목적</Label>
        <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2}
          placeholder="고객사 미팅, 기술 컨퍼런스 참석 등" required maxLength={300} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="country">목적지 국가</Label>
          <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="h-11 md:h-10" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">도시 (선택)</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="h-11 md:h-10" placeholder="서울, 도쿄, ..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 md:h-10" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="h-11 md:h-10" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accommodation">숙소 (선택)</Label>
        <Input id="accommodation" value={accommodation} onChange={(e) => setAccommodation(e.target.value)} className="h-11 md:h-10" placeholder="호텔명, 주소 또는 미정" />
      </div>

      {colleagues.length > 0 && (
        <div className="space-y-2">
          <Label>동반자 (선택)</Label>
          <div className="rounded-md border border-border max-h-44 overflow-y-auto p-2">
            {colleagues.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-muted/50 rounded cursor-pointer">
                <Checkbox
                  checked={accompanyingIds.includes(c.id)}
                  onCheckedChange={() => toggleAccompany(c.id)}
                  id={`acc-${c.id}`}
                />
                <span className="text-sm">{c.name}{c.employeeNo ? <span className="text-muted-foreground"> · {c.employeeNo}</span> : null}</span>
              </label>
            ))}
          </div>
          {accompanyingIds.length > 0 && (
            <p className="text-xs text-muted-foreground">선택 {accompanyingIds.length}명 · 각자 별도 신청이 필요합니다.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">참고 사항 (선택)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="결재자에게 전달할 추가 정보" maxLength={1000} />
      </div>

      <Button type="submit" className="w-full h-11 md:h-10" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        신청 제출
      </Button>
    </form>
  );
}
