import { NextResponse } from 'next/server'
import { ContentType } from '@/types'

export interface SearchResult {
  external_id: string
  external_src: string
  title: string
  cover_url: string | null
  description: string | null
  metadata: Record<string, unknown>
}

async function searchBooks(query: string): Promise<SearchResult[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ja&maxResults=8&orderBy=relevance`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.items) return []

  return data.items.map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown>
    const images = info.imageLinks as Record<string, string> | undefined
    const cover = images?.thumbnail?.replace('http://', 'https://') ?? null
    return {
      external_id: item.id as string,
      external_src: 'google_books',
      title: (info.title as string) ?? '',
      cover_url: cover,
      description: (info.description as string) ?? null,
      metadata: {
        authors: info.authors,
        publishedDate: info.publishedDate,
        pageCount: info.pageCount,
        categories: info.categories,
      },
    }
  })
}

async function searchAniList(query: string, type: 'ANIME' | 'MANGA'): Promise<SearchResult[]> {
  const gql = `
    query ($search: String, $type: MediaType) {
      Page(page: 1, perPage: 8) {
        media(search: $search, type: $type) {
          id
          title { native romaji english }
          description(asHtml: false)
          coverImage { large }
          startDate { year }
          genres
          episodes
          chapters
        }
      }
    }
  `
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables: { search: query, type } }),
  })
  const data = await res.json()
  const items = data?.data?.Page?.media ?? []

  return items.map((item: Record<string, unknown>) => {
    const title = item.title as Record<string, string>
    const coverImage = item.coverImage as Record<string, string>
    const desc = (item.description as string | null)?.replace(/<[^>]+>/g, '') ?? null
    return {
      external_id: String(item.id),
      external_src: 'anilist',
      title: title.native ?? title.romaji ?? title.english ?? '',
      cover_url: coverImage?.large ?? null,
      description: desc,
      metadata: {
        romaji: title.romaji,
        english: title.english,
        genres: item.genres,
        episodes: item.episodes,
        chapters: item.chapters,
        startYear: (item.startDate as Record<string, number>)?.year,
      },
    }
  })
}

async function searchMovies(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) return []

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ja-JP`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.results) return []

  return data.results.slice(0, 8).map((item: Record<string, unknown>) => ({
    external_id: String(item.id),
    external_src: 'tmdb',
    title: (item.title as string) ?? '',
    cover_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    description: (item.overview as string) || null,
    metadata: {
      release_date: item.release_date,
      vote_average: item.vote_average,
      original_title: item.original_title,
    },
  }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const type = searchParams.get('type') as ContentType

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    let results: SearchResult[] = []

    if (type === 'book') {
      results = await searchBooks(query)
    } else if (type === 'manga') {
      const [anilist, books] = await Promise.all([
        searchAniList(query, 'MANGA'),
        searchBooks(query),
      ])
      results = [...anilist, ...books].slice(0, 8)
    } else if (type === 'anime') {
      results = await searchAniList(query, 'ANIME')
    } else if (type === 'movie') {
      results = await searchMovies(query)
    }

    return NextResponse.json({ results })
  } catch (e) {
    console.error('Search error:', e)
    return NextResponse.json({ results: [], error: 'Search failed' })
  }
}
