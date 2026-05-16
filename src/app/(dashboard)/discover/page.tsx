import { createClient } from '@/lib/supabase/server'
import { generateRecommendations } from '@/lib/recommend'
import { Suspense } from 'react'
import Image from 'next/image'
import { AddToListButton } from '@/components/discover/AddToListButton'
import { Sparkles, Map, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ディスカバー</h1>
        <p className="text-sm text-muted-foreground mt-1">あなたの登録データをもとに分析しています</p>
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
  const { data: contents } = await supabase.from('contents').select('*').order('created_at', { ascending: false })

  const result = await generateRecommendations(contents ?? [])

  if ((contents ?? []).length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>マイリストにコンテンツを登録するとおすすめが表示されます</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
        あなたのプロフィール：<span className="text-foreground font-medium">{result.profileSummary}</span>
        <span className="ml-2 text-xs">（登録{(contents ?? []).length}作品から分析）</span>
      </div>

      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-bold">これ好きなんじゃない？</h2>
        </div>
        <Tabs defaultValue="anime">
          <TabsList>
            <TabsTrigger value="anime">アニメ</TabsTrigger>
            <TabsTrigger value="manga">漫画</TabsTrigger>
          </TabsList>
          <TabsContent value="anime">
            <RecGrid items={result.animeRecs} emptyMessage="アニメを評価・完了するとおすすめが表示されます" />
          </TabsContent>
          <TabsContent value="manga">
            <RecGrid items={result.mangaRecs} emptyMessage="漫画を評価・完了するとおすすめが表示されます" />
          </TabsContent>
        </Tabs>
      </section>

      {/* Discovery */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-bold">これ未ジャンルじゃない？</h2>
        </div>
        <Tabs defaultValue="anime">
          <TabsList>
            <TabsTrigger value="anime">アニメ</TabsTrigger>
            <TabsTrigger value="manga">漫画</TabsTrigger>
          </TabsList>
          <TabsContent value="anime">
            <DiscoveryGrid discoveries={result.animeDiscoveries} />
          </TabsContent>
          <TabsContent value="manga">
            <DiscoveryGrid discoveries={result.mangaDiscoveries} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

function RecGrid({ items, emptyMessage }: { items: Awaited<ReturnType<typeof generateRecommendations>>['animeRecs'], emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {items.map((item) => (
        <div key={`${item.external_src}-${item.external_id}`} className="space-y-2">
          <div className="aspect-[2/3] relative bg-muted rounded-lg overflow-hidden">
            {item.cover_url
              ? <Image src={item.cover_url} alt={item.title} fill className="object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">📚</div>
            }
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium line-clamp-2 leading-snug">{item.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{item.matchReason}</p>
            <AddToListButton item={item} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DiscoveryGrid({ discoveries }: { discoveries: Awaited<ReturnType<typeof generateRecommendations>>['animeDiscoveries'] }) {
  if (discoveries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">未開拓ジャンルが見つかりませんでした</p>
  }
  return (
    <div className="space-y-4">
      {discoveries.map((d) => (
        <div key={d.genreEn} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">{d.genre}</Badge>
            <p className="text-sm text-muted-foreground">{d.reason}</p>
          </div>
          <div className="flex gap-3">
            {d.examples.map((ex) => (
              <div key={ex.external_id} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-10 h-14 relative bg-muted rounded shrink-0 overflow-hidden">
                  {ex.cover_url
                    ? <Image src={ex.cover_url} alt={ex.title} fill className="object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg">📺</div>
                  }
                </div>
                <p className="text-xs line-clamp-2 leading-snug">{ex.title}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
