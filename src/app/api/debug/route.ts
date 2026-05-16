import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return NextResponse.json({
    url_set: !!url,
    url_preview: url ? url.slice(0, 30) + '...' : 'NOT SET',
    key_set: !!key,
    key_preview: key ? key.slice(0, 20) + '...' : 'NOT SET',
  })
}
