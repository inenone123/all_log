import { createClient } from '@/lib/supabase/server'
import { generateRecommendations } from '@/lib/recommend'
import { Suspense } from 'react'
import Image from 'next/image'
import { AddToListButton } from '@/components/discover/AddToListButton'
import { Sparkles, Map, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DiscoverPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ディスカバー</h1>
        <p className="text-sm text-muted-foreground mt-1">
          あなたの登録データをもとに分析しています
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>あなたの好みを分析中...</span>
        </div>
      }>
        <DiscoverContent />
      </Suspense>
    </div>
  )
}

async function DiscoverContent() {
  const supabase = await createClient()
  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false })

  const result = await generateRecommendations(contents ?? [])

  if ((contents ?? []).length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>マイリストにコンテンツを登録すると</p>
        <p>おすすめが表示されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Profile summary */}
      <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
        あなたのプロフィール：<span className="text-foreground font-medium">{result.profileSummary}</span>
        {result.topGenres.length > 0 && (
          <span className="ml-2 text-xs">
            （登録{(contents ?? []).length}作品から分析）
          </span>
        )}
      </div>

      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-bold">これ好きなんじゃない？</h2>
        </div>

        {result.recommendations.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            アニメ・漫画を評価・完了すると、より精度の高いおすすめが表示されます
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {result.recommendations.map((item) => (
              <div key={`${item.external_src}-${item.external_id}`} className="space-y-2">
                <div className="aspect-[2/3] relative bg-muted rounded-lg overflow-hidden">
                  {item.cover_url ? (
                    <Image src={item.cover_url} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium line-clamp-2 leading-snug">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{item.matchReason}</p>
                  <AddToListButton item={item} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unexplored genres */}
      {result.discoveries.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold">これ未ジャンルじゃない？</h2>
          </div>

          <div className="space-y-6">
            {result.discoveries.map((d) => (
              <div key={d.genreEn} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {d.genre}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{d.reason}</p>
                </div>
                <div className="flex gap-3">
                  {d.examples.map((ex) => (
                    <div key={ex.external_id} className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-10 h-14 relative bg-muted rounded shrink-0 overflow-hidden">
                        {ex.cover_url ? (
                          <Image src={ex.cover_url} alt={ex.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                        )}
                      </div>
                      <p className="text-xs line-clamp-2 leading-snug">{ex.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
