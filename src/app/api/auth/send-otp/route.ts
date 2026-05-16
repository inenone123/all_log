import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email } = await request.json()
  const supabase = await createClient()

  const siteUrl = process.env.SITE_URL
  if (!siteUrl) {
    return NextResponse.json({ error: 'SITE_URL not configured' }, { status: 500 })
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message, status: error.status }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
