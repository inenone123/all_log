export type ContentType = 'book' | 'manga' | 'novel' | 'movie' | 'anime' | 'other'
export type ContentStatus = 'want' | 'reading' | 'completed' | 'dropped'

export interface Content {
  id: string
  user_id: string
  type: ContentType
  title: string
  cover_url: string | null
  description: string | null
  external_id: string | null
  external_src: string | null
  metadata: Record<string, unknown>
  status: ContentStatus | null
  rating: number | null
  memo: string | null
  tags: string[]
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface CreateContentInput {
  type: ContentType
  title: string
  cover_url?: string
  description?: string
  status?: ContentStatus
  rating?: number
  memo?: string
  tags?: string[]
}
