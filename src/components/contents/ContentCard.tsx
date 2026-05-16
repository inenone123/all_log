import Link from 'next/link'
import Image from 'next/image'
import { Content, ContentStatus, ContentType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, BookOpen, Film, Tv, BookMarked, HelpCircle } from 'lucide-react'

const TYPE_LABELS: Record<ContentType, string> = {
  book: '本',
  manga: '漫画',
  movie: '映画',
  anime: 'アニメ',
  other: 'その他',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  want: '積み',
  reading: '進行中',
  completed: '完了',
  dropped: '断念',
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  want: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reading: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  book: BookOpen,
  manga: BookMarked,
  movie: Film,
  anime: Tv,
  other: HelpCircle,
}

interface Props {
  content: Content
}

export function ContentCard({ content }: Props) {
  const Icon = TYPE_ICONS[content.type]

  return (
    <Link href={`/contents/${content.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="aspect-[2/3] relative bg-muted rounded-t-xl overflow-hidden">
            {content.cover_url ? (
              <Image
                src={content.cover_url}
                alt={content.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="p-3 space-y-2">
            <p className="font-medium text-sm line-clamp-2 leading-snug">{content.title}</p>
            <div className="flex items-center justify-between gap-1">
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[content.type]}
              </Badge>
              {content.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[content.status]}`}>
                  {STATUS_LABELS[content.status]}
                </span>
              )}
            </div>
            {content.rating != null && content.rating > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < content.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
