'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Content } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, List, Plus, X, BookMarked, BookOpen, Calendar } from 'lucide-react'
import Image from 'next/image'

type ViewMode = 'list' | 'calendar'

interface Props {
  allContents: Content[]
  trackedContents: Content[]
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function getStatusLabel(days: number): { label: string; color: string } {
  if (days < 0) return { label: '発売済み', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' }
  if (days === 0) return { label: '本日発売！', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' }
  if (days <= 7) return { label: `あと${days}日`, color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
  if (days <= 30) return { label: `あと${days}日`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' }
  return { label: `あと${days}日`, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' }
}

// A button that triggers native date picker
function DatePickerButton({
  value,
  onChange,
  placeholder = '日付を選ぶ',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => ref.current?.showPicker?.() ?? ref.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        {value ? formatDate(value) : <span className="text-muted-foreground">{placeholder}</span>}
      </button>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 w-full cursor-pointer"
        tabIndex={-1}
      />
    </div>
  )
}

export function ReleasesClient({ allContents, trackedContents }: Props) {
  const [view, setView] = useState<ViewMode>('list')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [addDates, setAddDates] = useState<Record<string, string>>({})
  // Calendar day click state
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dayPickContent, setDayPickContent] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  const untracked = allContents.filter((c) => !c.metadata?.next_release_date)

  const sorted = [...trackedContents].sort((a, b) => {
    const da = a.metadata?.next_release_date as string
    const db = b.metadata?.next_release_date as string
    return da.localeCompare(db)
  })

  async function saveDate(content: Content, date: string) {
    if (!date) return
    setSaving(true)
    await supabase.from('contents').update({
      metadata: { ...((content.metadata as Record<string, unknown>) ?? {}), next_release_date: date },
      updated_at: new Date().toISOString(),
    }).eq('id', content.id)
    setEditingId(null)
    setEditDate('')
    setSaving(false)
    router.refresh()
  }

  async function removeDate(content: Content) {
    const meta = { ...((content.metadata as Record<string, unknown>) ?? {}) }
    delete meta.next_release_date
    await supabase.from('contents').update({
      metadata: meta,
      updated_at: new Date().toISOString(),
    }).eq('id', content.id)
    router.refresh()
  }

  async function saveDayAssignment() {
    if (!dayPickContent || selectedDay === null) return
    const content = untracked.find((c) => c.id === dayPickContent)
    if (!content) return
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    await saveDate(content, date)
    setSelectedDay(null)
    setDayPickContent('')
  }

  // Calendar
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const releaseByDay: Record<number, Content[]> = {}
  for (const c of sorted) {
    const d = new Date(c.metadata?.next_release_date as string)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!releaseByDay[day]) releaseByDay[day] = []
      releaseByDay[day].push(c)
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')} className="gap-2">
            <List className="h-4 w-4" />リスト
          </Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')} className="gap-2">
            <CalendarDays className="h-4 w-4" />カレンダー
          </Button>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddPanel(!showAddPanel)}>
          <Plus className="h-4 w-4" />日付を追加
        </Button>
      </div>

      {/* Add panel */}
      {showAddPanel && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium">発売日を設定する作品</p>
            {untracked.length === 0 ? (
              <p className="text-sm text-muted-foreground">すべての作品に発売日が設定済みです</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {untracked.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-8 h-11 relative bg-muted rounded shrink-0 overflow-hidden">
                      {c.cover_url
                        ? <Image src={c.cover_url} alt={c.title} fill className="object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs">📚</div>
                      }
                    </div>
                    <p className="text-sm flex-1 line-clamp-1">{c.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <DatePickerButton
                        value={addDates[c.id] ?? ''}
                        onChange={(v) => setAddDates((prev) => ({ ...prev, [c.id]: v }))}
                      />
                      {addDates[c.id] && (
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() => saveDate(c, addDates[c.id])}
                        >
                          保存
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 && !showAddPanel && (
        <div className="text-center py-16 text-muted-foreground">
          <BookMarked className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>発売予定日が設定された作品がありません</p>
          <p className="text-sm mt-1">「日付を追加」から設定してください</p>
        </div>
      )}

      {/* List view */}
      {view === 'list' && sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((c) => {
            const dateStr = c.metadata?.next_release_date as string
            const days = daysUntil(dateStr)
            const { label, color } = getStatusLabel(days)
            return (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-14 relative bg-muted rounded shrink-0 overflow-hidden">
                    {c.cover_url
                      ? <Image src={c.cover_url} alt={c.title} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          {c.type === 'manga'
                            ? <BookMarked className="h-5 w-5 text-muted-foreground/30" />
                            : <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                          }
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(dateStr)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <DatePickerButton value={editDate} onChange={setEditDate} />
                        <Button size="sm" className="h-8" onClick={() => saveDate(c, editDate)} disabled={saving || !editDate}>保存</Button>
                        <button onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setEditingId(c.id); setEditDate(dateStr) }}>変更</Button>
                        <button onClick={() => removeDate(c)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>＜ 前月</Button>
            <span className="font-semibold">{year}年{month + 1}月</span>
            <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>次月 ＞</Button>
          </div>

          {/* Day click: select work to assign */}
          {selectedDay !== null && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{year}年{month + 1}月{selectedDay}日に発売する作品を選択</p>
                  <button onClick={() => { setSelectedDay(null); setDayPickContent('') }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                {untracked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">設定できる作品がありません</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {untracked.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setDayPickContent(c.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${dayPickContent === c.id ? 'bg-primary/10 border border-primary' : 'hover:bg-accent'}`}
                      >
                        <div className="w-7 h-10 relative bg-muted rounded shrink-0 overflow-hidden">
                          {c.cover_url
                            ? <Image src={c.cover_url} alt={c.title} fill className="object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xs">📚</div>
                          }
                        </div>
                        <p className="text-sm line-clamp-1">{c.title}</p>
                      </button>
                    ))}
                  </div>
                )}
                <Button className="w-full" disabled={!dayPickContent || saving} onClick={saveDayAssignment}>
                  この日に設定
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-7 text-center border rounded-lg overflow-hidden">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <div key={d} className={`text-xs font-medium py-2 bg-muted/50 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-14 border-t border-r last:border-r-0 bg-muted/20" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
              const releases = releaseByDay[day] ?? []
              const col = (firstDay + i) % 7
              return (
                <div
                  key={day}
                  onClick={() => { setSelectedDay(day); setDayPickContent('') }}
                  className={`min-h-14 p-1 border-t cursor-pointer transition-colors hover:bg-accent/50 ${col !== 6 ? 'border-r' : ''} ${isToday ? 'bg-primary/5' : ''} ${selectedDay === day ? 'ring-2 ring-primary ring-inset' : ''}`}
                >
                  <span className={`text-xs font-medium block text-center w-5 h-5 mx-auto ${isToday ? 'bg-primary text-primary-foreground rounded-full flex items-center justify-center' : col === 0 ? 'text-red-500' : col === 6 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {releases.map((c) => (
                      <div key={c.id} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 line-clamp-1 leading-tight">
                        {c.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
