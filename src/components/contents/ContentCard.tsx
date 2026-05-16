'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Content, ContentStatus, ContentType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheck,
} from '@/components/ui/dropdown-menu'
import { Star, BookOpen, Film, Tv, BookMarked, HelpCircle } from 'lucide-react'

const TYPE_LABELS: Record<ContentType, string> = {
  book: '本', manga: '漫画', novel: '小説', movie: '映画', anime: 'アニメ', other: 'その他',
}

const STATUS_LABELS: Record<ContentStatus, string> = {
  want: '積み', reading: '進行中', completed: '完了', dropped: '断念',
}

const STATUS_COLORS: Record<ContentStatus, string> = {
  want: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  reading: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  dropped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  book: BookOpen, manga: BookMarked, novel: BookOpen, movie: Film, anime: Tv, other: HelpCircle,
}

const STATUSES = Object.keys(STATUS_LABELS) as ContentStatus[]

interface Props {
  content: Content
}

export function ContentCard({ content }: Props) {
  const [status, setStatus] = useState<ContentStatus>(content.status ?? 'want')
  const [rating, setRating] = useState<number>(content.rating ?? 0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const router = useRouter()
  const supabase = createClient()
  const Icon = TYPE_ICONS[content.type]

  async function handleStatusChange(newStatus: ContentStatus) {
    setStatus(newStatus)
    await supabase.from('contents').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    }).eq('id', content.id)
    router.refresh()
  }

  async function handleRatingChange(newRating: number) {
    const next = rating === newRating ? 0 : newRating
    setRating(next)
    await supabase.from('contents').update({
      rating: next || null,
      updated_at: new Date().toISOString(),
    }).eq('id', content.id)
    router.refresh()
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardContent className="p-0">
        {/* Cover — tapping navigates to detail */}
        <Link href={`/contents/${content.id}`}>
          <div className="aspect-[2/3] relative bg-muted rounded-t-xl overflow-hidden">
            {content.cover_url ? (
              <Image src={content.cover_url} alt={content.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </Link>

        <div className="p-2.5 space-y-2">
          {/* Title */}
          <Link href={`/contents/${content.id}`}>
            <p className="font-medium text-xs line-clamp-2 leading-snug hover:underline">
              {content.title}
            </p>
          </Link>

          {/* Type + Status */}
          <div className="flex items-center justify-between gap-1">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {TYPE_LABELS[content.type]}
            </Badge>

            {/* Status badge — click to change */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 ${STATUS_COLORS[status]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {STATUS_LABELS[status]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="gap-2"
                  >
                    {s === status && <DropdownMenuCheck className="h-3.5 w-3.5" />}
                    <span className={s !== status ? 'pl-5' : ''}>{STATUS_LABELS[s]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Star rating — tap to rate */}
          <div
            className="flex items-center gap-0.5"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleRatingChange(i)}
                onMouseEnter={() => setHoverRating(i)}
                className="touch-manipulation"
              >
                <Star
                  className={`h-3.5 w-3.5 transition-colors ${
                    i <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30 hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
