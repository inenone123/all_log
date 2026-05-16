'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Mode = 'password' | 'magic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<Mode>('password')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスかパスワードが違います')
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(`エラー: ${data.error}`)
      } else {
        setSent(true)
      }
    } catch {
      setError('送信に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">MyMediaLog</CardTitle>
          <CardDescription>あなたのメディア記録帳</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(null) }}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
              >
                パスワードを忘れた・未設定の場合はこちら
              </button>
            </form>
          )}

          {mode === 'magic' && !sent && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                メールアドレスにログインリンクを送ります。ログイン後にパスワードを設定できます。
              </p>
              <div className="space-y-2">
                <Label htmlFor="email-magic">メールアドレス</Label>
                <Input
                  id="email-magic"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '送信中...' : 'ログインリンクを送信'}
              </Button>
              <button
                type="button"
                onClick={() => { setMode('password'); setError(null) }}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center"
              >
                パスワードでログインに戻る
              </button>
            </form>
          )}

          {mode === 'magic' && sent && (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> にログインリンクを送信しました。
              </p>
              <p className="text-xs text-muted-foreground">ログイン後にパスワードを設定してください。</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
