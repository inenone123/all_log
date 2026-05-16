import { NextResponse } from 'next/server'

export interface VolumeInfo {
  title: string
  volume: string | null
  date: string | null
  isbn: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  if (!query) return NextResponse.json({ volumes: [] })

  try {
    const url = `https://api.openbd.jp/v1/search?q=${encodeURIComponent(query)}&limit=20`
    const res = await fetch(url)
    const data = await res.json()
    if (!Array.isArray(data)) return NextResponse.json({ volumes: [] })

    const volumes: VolumeInfo[] = data
      .filter((item: unknown) => {
        const i = item as Record<string, unknown>
        return i?.summary
      })
      .map((item: unknown) => {
        const i = item as Record<string, unknown>
        const summary = i.summary as Record<string, unknown>
        const dateStr = summary.pubdate as string | undefined
        let date: string | null = null
        if (dateStr && dateStr.length >= 6) {
          const y = dateStr.slice(0, 4)
          const m = dateStr.slice(4, 6)
          const d = dateStr.length >= 8 ? dateStr.slice(6, 8) : '01'
          date = `${y}-${m}-${d}`
        }
        return {
          title: (summary.title as string) ?? '',
          volume: null,
          date,
          isbn: (summary.isbn as string) ?? '',
        }
      })
      .filter((v) => v.date)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

    return NextResponse.json({ volumes })
  } catch {
    return NextResponse.json({ volumes: [] })
  }
}
