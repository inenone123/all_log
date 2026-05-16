# MyMediaLog セットアップガイド

## 必要なもの
- Node.js 18+
- Supabase アカウント（無料） → https://supabase.com
- Vercel アカウント（無料） → https://vercel.com

## ローカル開発

### 1. 依存関係インストール
```bash
npm install
```

### 2. Supabase プロジェクト作成
1. https://supabase.com でプロジェクトを新規作成
2. **Project Settings > API** から以下をコピー:
   - `Project URL`
   - `anon public` キー

### 3. 環境変数設定
```bash
cp .env.local.example .env.local
```
`.env.local` を編集して Supabase の URL と anon key を入力。

### 4. データベースセットアップ
Supabase ダッシュボードの **SQL Editor** で
`supabase/migrations/20240101000000_init.sql` の内容を貼り付けて実行。

### 5. 開発サーバー起動
```bash
npm run dev
```
http://localhost:3000 にアクセス。

---

## Vercel デプロイ

1. GitHub にプッシュ（このリポジトリ）
2. https://vercel.com でリポジトリをインポート
3. **Environment Variables** に以下を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイ実行

---

## Supabase 認証設定（重要）

デプロイ後、Supabase ダッシュボードで設定が必要:

**Authentication > URL Configuration**
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

ローカル開発用に以下も追加:
- `http://localhost:3000/auth/callback`
