'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Content, ContentStatus, ContentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Star, ArrowLeft, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const TYPE_LABELS: Record<ContentType, string> = {
  book: '本', manga: '漫画', movie: '映画', anime: 'アニメ', other: 'その他',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  want: '積み', reading: '進行中', completed: '完了', dropped: '断念',
}

interface Props {
  content: Content
}

export function ContentDetail({ content }: Props) {
  const [status, setStatus] = useState<ContentStatus>(content.status ?? 'want')
  const [rating, setRating] = useState<number>(content.rating ?? 0)
  const [memo, setMemo] = useState(content.memo ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase.from('contents').update({
      status,
      rating: rating || null,
      memo: memo || null,
      updated_at: new Date().toISOString(),
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }).eq('id', content.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm(`「${content.title}」を削除しますか？`)) return
    await supabase.from('contents').delete().eq('id', content.id)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1 line-clamp-2 leading-snug">{content.title}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive hover:text-destructive shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-28 sm:w-36 shrink-0">
          <div className="aspect-[2/3] relative bg-muted rounded-lg overflow-hidden">
            {content.cover_url ? (
              <Image src={content.cover_url} alt={content.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground/30">
                📚
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <Badge variant="outline">{TYPE_LABELS[content.type]}</Badge>
          {content.description && (
            <p className="text-sm text-muted-foreground">{content.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            登録日: {new Date(content.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold">記録</h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">ステータス</label>
          <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">評価</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(rating === i ? 0 : i)}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    i <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">メモ・感想</label>
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="感想や覚書きを入力..."
            rows={5}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? '保存中...' : saved ? '保存しました！' : '保存'}
        </Button>
      </div>
    </div>
  )
}
