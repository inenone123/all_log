import { createClient } from '@/lib/supabase/server'
import { ContentList } from '@/components/contents/ContentList'
import { AddContentButton } from '@/components/contents/AddContentButton'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">マイリスト</h1>
        <AddContentButton />
      </div>
      <ContentList initialContents={contents ?? []} />
    </div>
  )
}
