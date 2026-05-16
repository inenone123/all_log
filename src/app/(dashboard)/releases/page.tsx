import { createClient } from '@/lib/supabase/server'
import { ReleasesClient } from '@/components/releases/ReleasesClient'

export default async function ReleasesPage() {
  const supabase = await createClient()
  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .in('type', ['manga', 'book'])
    .order('title')

  const tracked = (contents ?? []).filter(
    (c) => c.metadata?.next_release_date
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">発売予定</h1>
        <p className="text-sm text-muted-foreground mt-1">
          登録済みの漫画・本の次巻発売日を管理できます
        </p>
      </div>
      <ReleasesClient allContents={contents ?? []} trackedContents={tracked} />
    </div>
  )
}
