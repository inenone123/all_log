'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, X, Loader2, ChevronLeft } from 'lucide-react'
import { ContentType, ContentStatus } from '@/types'
import { SearchResult } from '@/app/api/search/route'
import Image from 'next/image'

const SEARCHABLE_TYPES: ContentType[] = ['book', 'manga', 'anime', 'movie']

type Step = 'search' | 'confirm'

interface FormState {
  title: string
  type: ContentType
  status: ContentStatus
  memo: string
  cover_url: string
  description: string
  external_id: string
  external_src: string
  metadata: Record<string, unknown>
}

const defaultForm = (): FormState => ({
  title: '',
  type: 'book',
  status: 'want',
  memo: '',
  cover_url: '',
  description: '',
  external_id: '',
  external_src: '',
  metadata: {},
})

export function AddContentButton() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('search')
  const [form, setForm] = useState<FormState>(defaultForm())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleOpen(val: boolean) {
    setOpen(val)
    if (!val) {
      setStep('search')
      setForm(defaultForm())
      setQuery('')
      setResults([])
    }
  }

  async function runSearch(q: string, type: ContentType) {
    if (!q.trim() || !SEARCHABLE_TYPES.includes(type)) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  function handleQueryChange(q: string) {
    setQuery(q)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => runSearch(q, form.type), 500)
  }

  function handleTypeChange(type: ContentType) {
    setForm(f => ({ ...f, type }))
    setResults([])
    if (query.trim()) {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(() => runSearch(query, type), 300)
    }
  }

  function selectResult(result: SearchResult) {
    setForm(f => ({
      ...f,
      title: result.title,
      cover_url: result.cover_url ?? '',
      description: result.description ?? '',
      external_id: result.external_id,
      external_src: result.external_src,
      metadata: result.metadata,
    }))
    setStep('confirm')
  }

  function selectManual() {
    setForm(f => ({ ...f, title: query }))
    setStep('confirm')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contents').insert({
      user_id: user.id,
      title: form.title,
      type: form.type,
      status: form.status,
      memo: form.memo || null,
      cover_url: form.cover_url || null,
      description: form.description || null,
      external_id: form.external_id || null,
      external_src: form.external_src || null,
      metadata: form.metadata,
    })

    handleOpen(false)
    setSaving(false)
    router.refresh()
  }

  const canSearch = SEARCHABLE_TYPES.includes(form.type)

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'コンテンツを追加' : '詳細を確認'}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>種別</Label>
                <Select value={form.type} onValueChange={(v) => handleTypeChange(v as ContentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">本</SelectItem>
                    <SelectItem value="manga">漫画</SelectItem>
                    <SelectItem value="novel">小説</SelectItem>
                    <SelectItem value="anime">アニメ</SelectItem>
                    <SelectItem value="movie">映画</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ステータス</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as ContentStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="want">積み</SelectItem>
                    <SelectItem value="reading">進行中</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="dropped">断念</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {canSearch ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                  {!searching && query && (
                    <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  <Input
                    placeholder="タイトルで検索..."
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    className="pl-9 pr-9"
                    autoFocus
                  />
                </div>

                <div className="overflow-y-auto flex-1 -mx-6 px-6">
                  {results.length > 0 && (
                    <div className="space-y-1">
                      {results.map((r) => (
                        <button
                          key={`${r.external_src}-${r.external_id}`}
                          onClick={() => selectResult(r)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent text-left transition-colors"
                        >
                          <div className="w-10 h-14 relative bg-muted rounded shrink-0 overflow-hidden">
                            {r.cover_url ? (
                              <Image src={r.cover_url} alt={r.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📚</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{r.title}</p>
                            {r.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {query && !searching && results.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      検索結果がありません
                    </p>
                  )}

                  {query && (
                    <button
                      onClick={selectManual}
                      className="w-full mt-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-left"
                    >
                      「{query}」を手動で登録する
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="タイトルを入力"
                  autoFocus
                />
                <Button
                  className="w-full mt-2"
                  onClick={selectManual}
                  disabled={!query.trim()}
                >
                  次へ
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">
            <button
              type="button"
              onClick={() => setStep('search')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
            >
              <ChevronLeft className="h-4 w-4" />
              検索に戻る
            </button>

            <div className="flex gap-4">
              {form.cover_url && (
                <div className="w-20 shrink-0">
                  <div className="aspect-[2/3] relative bg-muted rounded overflow-hidden">
                    <Image src={form.cover_url} alt={form.title} fill className="object-cover" />
                  </div>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-title">タイトル</Label>
                  <Input
                    id="confirm-title"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                {form.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{form.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo">メモ（任意）</Label>
              <Textarea
                id="memo"
                value={form.memo}
                onChange={(e) => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="感想や覚書き..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => handleOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={saving || !form.title.trim()}>
                {saving ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
