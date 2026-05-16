'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus, Check } from 'lucide-react'
import { RecommendItem } from '@/lib/recommend'

interface Props {
  item: RecommendItem
}

export function AddToListButton({ item }: Props) {
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contents').insert({
      user_id: user.id,
      title: item.title,
      type: item.type,
      status: 'want',
      cover_url: item.cover_url,
      description: item.description,
      external_id: item.external_id,
      external_src: item.external_src,
      metadata: { genres: item.genres },
    })

    setAdded(true)
    setLoading(false)
    router.refresh()
  }

  if (added) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1 text-xs">
        <Check className="h-3 w-3" />
        追加済み
      </Button>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={handleAdd} disabled={loading} className="gap-1 text-xs">
      <Plus className="h-3 w-3" />
      積む
    </Button>
  )
}
