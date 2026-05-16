'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { ContentType, ContentStatus } from '@/types'

export function AddContentButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'book' as ContentType,
    status: 'want' as ContentStatus,
    memo: '',
  })
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contents').insert({
      user_id: user.id,
      title: form.title,
      type: form.type,
      status: form.status,
      memo: form.memo || null,
    })

    setOpen(false)
    setForm({ title: '', type: 'book', status: 'want', memo: '' })
    setLoading(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>コンテンツを追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="作品タイトルを入力"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>種別</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContentType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="book">本</SelectItem>
                  <SelectItem value="manga">漫画</SelectItem>
                  <SelectItem value="movie">映画</SelectItem>
                  <SelectItem value="anime">アニメ</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContentStatus })}>
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
          <div className="space-y-2">
            <Label htmlFor="memo">メモ（任意）</Label>
            <Textarea
              id="memo"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="感想や覚書き..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '登録中...' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
