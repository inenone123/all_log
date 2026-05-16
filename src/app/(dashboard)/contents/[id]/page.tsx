import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ContentDetail } from '@/components/contents/ContentDetail'

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: content } = await supabase
    .from('contents')
    .select('*')
    .eq('id', id)
    .single()

  if (!content) notFound()

  return <ContentDetail content={content} />
}
