import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const siteUrl = process.env.SITE_URL

  return NextResponse.json({
    supabase_url: url ? url.slice(0, 30) + '...' : 'NOT SET',
    supabase_key: key ? key.slice(0, 20) + '...' : 'NOT SET',
    site_url: siteUrl ?? 'NOT SET',
  })
}
