'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Content } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, List, Plus, X, BookMarked, BookOpen } from 'lucide-react'
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

export function ReleasesClient({ allContents, trackedContents }: Props) {
  const [view, setView] = useState<ViewMode>('list')
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const untracked = allContents.filter(
    (c) => !c.metadata?.next_release_date
  )

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
    setDateInput('')
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

  // Calendar helpers
  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const releaseDatesThisMonth = sorted.filter((c) => {
    const d = new Date(c.metadata?.next_release_date as string)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const releaseByDay: Record<number, Content[]> = {}
  for (const c of releaseDatesThisMonth) {
    const day = new Date(c.metadata?.next_release_date as string).getDate()
    if (!releaseByDay[day]) releaseByDay[day] = []
    releaseByDay[day].push(c)
  }

  const today = new Date()

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            リスト
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
            className="gap-2"
          >
            <CalendarDays className="h-4 w-4" />
            カレンダー
          </Button>
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddPanel(!showAddPanel)}>
          <Plus className="h-4 w-4" />
          日付を追加
        </Button>
      </div>

      {/* Add panel */}
      {showAddPanel && untracked.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium">発売日を設定する作品</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {untracked.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-11 relative bg-muted rounded shrink-0 overflow-hidden">
                    {c.cover_url
                      ? <Image src={c.cover_url} alt={c.title} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs">📚</div>
                    }
                  </div>
                  <p className="text-sm flex-1 line-clamp-1">{c.title}</p>
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="w-36 h-8 text-xs"
                      />
                      <Button size="sm" onClick={() => saveDate(c, dateInput)} disabled={saving || !dateInput}>
                        保存
                      </Button>
                      <button onClick={() => setEditingId(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(c.id); setDateInput('') }}>
                      日付を設定
                    </Button>
                  )}
                </div>
              ))}
            </div>
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
                          {c.type === 'manga' ? <BookMarked className="h-5 w-5 text-muted-foreground/30" /> : <BookOpen className="h-5 w-5 text-muted-foreground/30" />}
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
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={dateInput}
                          onChange={(e) => setDateInput(e.target.value)}
                          className="w-32 h-7 text-xs"
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => saveDate(c, dateInput)} disabled={saving || !dateInput}>保存</Button>
                        <button onClick={() => setEditingId(null)}><X className="h-3 w-3 text-muted-foreground" /></button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setEditingId(c.id); setDateInput(dateStr) }}>変更</Button>
                        <button onClick={() => removeDate(c)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>
              ＜ 前月
            </Button>
            <span className="font-semibold">{year}年{month + 1}月</span>
            <Button variant="ghost" size="sm" onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>
              次月 ＞
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <div key={d} className={`text-xs font-medium py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
              const releases = releaseByDay[day] ?? []
              return (
                <div key={day} className={`min-h-16 p-1 border-t ${isToday ? 'bg-primary/5' : ''}`}>
                  <span className={`text-xs font-medium ${isToday ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center mx-auto' : 'text-muted-foreground'}`}>
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
