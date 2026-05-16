import { Content } from '@/types'

export interface RecommendItem {
  external_id: string
  external_src: string
  title: string
  cover_url: string | null
  description: string | null
  type: 'anime' | 'manga' | 'book' | 'movie' | 'other'
  genres: string[]
  matchReason: string
  score: number
}

export interface GenreDiscovery {
  genre: string
  genreEn: string
  reason: string
  examples: Array<{ title: string; cover_url: string | null; external_id: string }>
}

export interface RecommendResult {
  recommendations: RecommendItem[]
  discoveries: GenreDiscovery[]
  profileSummary: string
  topGenres: string[]
}

// Genre display names
const GENRE_JA: Record<string, string> = {
  Action: 'アクション', Romance: 'ロマンス', Comedy: 'コメディ',
  Drama: 'ドラマ', Fantasy: 'ファンタジー', 'Sci-Fi': 'SF',
  Horror: 'ホラー', Mystery: 'ミステリー', 'Slice of Life': '日常系',
  Sports: 'スポーツ', Psychological: '心理', Thriller: 'サスペンス',
  Music: '音楽', Supernatural: '超自然',
}

const ALL_GENRES = Object.keys(GENRE_JA)

// --- Taste profile ---

interface TasteProfile {
  genreWeights: Record<string, number>
  topGenres: Array<{ genre: string; weight: number }>
}

function buildTasteProfile(contents: Content[]): TasteProfile {
  const genreWeights: Record<string, number> = {}

  for (const c of contents) {
    let weight = 1
    if (c.status === 'completed') weight += 2
    if (c.status === 'reading') weight += 1
    if (c.rating) weight += c.rating - 1

    const genres =
      (c.metadata?.genres as string[] | undefined) ??
      (c.metadata?.categories as string[] | undefined) ??
      []

    for (const g of genres) {
      genreWeights[g] = (genreWeights[g] ?? 0) + weight
    }
  }

  const topGenres = Object.entries(genreWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre, weight]) => ({ genre, weight }))

  return { genreWeights, topGenres }
}

// --- AniList recommendation fetch ---

async function fetchAniListRecs(
  mediaId: string,
  genreWeights: Record<string, number>
): Promise<RecommendItem[]> {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        recommendations(perPage: 10, sort: RATING_DESC) {
          nodes {
            rating
            mediaRecommendation {
              id type title { native romaji }
              description(asHtml: false)
              coverImage { large }
              genres meanScore
            }
          }
        }
      }
    }
  `
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: parseInt(mediaId) } }),
    })
    const data = await res.json()
    const nodes: unknown[] = data?.data?.Media?.recommendations?.nodes ?? []

    return nodes
      .filter((n): n is Record<string, unknown> => {
        const node = n as Record<string, unknown>
        return !!node.mediaRecommendation
      })
      .map((n) => {
        const node = n as Record<string, unknown>
        const m = node.mediaRecommendation as Record<string, unknown>
        const genres = (m.genres as string[]) ?? []
        const matchedGenres = genres.filter((g) => (genreWeights[g] ?? 0) > 0)
        const ratingScore = ((node.rating as number) ?? 0) * 0.5
        const genreScore = matchedGenres.length * 20
        const communityScore = ((m.meanScore as number) ?? 0) * 0.1
        const score = ratingScore + genreScore + communityScore
        const titleObj = m.title as Record<string, string>

        return {
          external_id: String(m.id),
          external_src: 'anilist',
          title: titleObj.native ?? titleObj.romaji ?? '',
          cover_url: (m.coverImage as Record<string, string>)?.large ?? null,
          description:
            ((m.description as string) ?? '')
              .replace(/<[^>]+>/g, '')
              .slice(0, 150) || null,
          type: (m.type as string) === 'MANGA' ? 'manga' : 'anime',
          genres,
          matchReason:
            matchedGenres.length > 0
              ? `${matchedGenres.slice(0, 2).map(g => GENRE_JA[g] ?? g).join('・')}が好きなあなたに`
              : 'コミュニティで高評価',
          score,
        } satisfies RecommendItem
      })
  } catch {
    return []
  }
}

// --- Unexplored genre discovery ---

async function fetchUnexploredGenres(
  genreWeights: Record<string, number>,
  existingIds: Set<string>
): Promise<GenreDiscovery[]> {
  const exploredGenres = new Set(
    Object.entries(genreWeights)
      .filter(([, w]) => w > 0)
      .map(([g]) => g)
  )
  const unexplored = ALL_GENRES.filter((g) => !exploredGenres.has(g))
  if (unexplored.length === 0) return []

  const targets = unexplored.slice(0, 3)
  const results: GenreDiscovery[] = []

  await Promise.all(
    targets.map(async (genre) => {
      const query = `
        query ($genre: String) {
          Page(page: 1, perPage: 4) {
            media(genre: $genre, type: ANIME, sort: POPULARITY_DESC) {
              id title { native romaji } coverImage { large }
            }
          }
        }
      `
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { genre } }),
        })
        const data = await res.json()
        const items: unknown[] = data?.data?.Page?.media ?? []
        const examples = items
          .map((item) => {
            const m = item as Record<string, unknown>
            const title = m.title as Record<string, string>
            return {
              title: title.native ?? title.romaji ?? '',
              cover_url: (m.coverImage as Record<string, string>)?.large ?? null,
              external_id: String(m.id),
            }
          })
          .filter((ex) => !existingIds.has(ex.external_id))
          .slice(0, 3)

        if (examples.length > 0) {
          results.push({
            genre: GENRE_JA[genre] ?? genre,
            genreEn: genre,
            reason: `あなたのリストに${GENRE_JA[genre] ?? genre}作品がまだありません`,
            examples,
          })
        }
      } catch {
        // skip
      }
    })
  )

  return results
}

// --- Main entry point ---

export async function generateRecommendations(
  contents: Content[]
): Promise<RecommendResult> {
  if (contents.length === 0) {
    return {
      recommendations: [],
      discoveries: [],
      profileSummary: 'コンテンツを登録するとおすすめが表示されます',
      topGenres: [],
    }
  }

  const { genreWeights, topGenres } = buildTasteProfile(contents)

  const existingIds = new Set(
    contents.map((c) => c.external_id ?? '').filter(Boolean)
  )

  // Top enjoyed AniList content as recommendation seeds
  const seeds = contents
    .filter(
      (c) =>
        c.external_src === 'anilist' &&
        c.external_id &&
        (c.status === 'completed' || (c.rating ?? 0) >= 4)
    )
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3)

  // Fetch recs in parallel
  const recArrays = await Promise.all(
    seeds.map((c) => fetchAniListRecs(c.external_id!, genreWeights))
  )

  const seen = new Set<string>()
  const recommendations = recArrays
    .flat()
    .filter((r) => {
      if (existingIds.has(r.external_id) || seen.has(r.external_id)) return false
      seen.add(r.external_id)
      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  const discoveries = await fetchUnexploredGenres(genreWeights, existingIds)

  const topGenreNames = topGenres
    .slice(0, 3)
    .map((g) => GENRE_JA[g.genre] ?? g.genre)

  const profileSummary =
    topGenreNames.length > 0
      ? `${topGenreNames.join('・')}が好みのようです`
      : '様々なジャンルを楽しんでいます'

  return { recommendations, discoveries, profileSummary, topGenres: topGenreNames }
}
