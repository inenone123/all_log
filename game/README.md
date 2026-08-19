# ActionAdventure — 縦の断面（Vertical Slice）

Godot 4.x / GDScript の 2D 横スクロール アクション・アドベンチャー。
仕様は [`SPEC.md`](./SPEC.md)、常設ルールは [`CLAUDE.md`](./CLAUDE.md) を参照。

> このプロジェクトはリポジトリ内の `game/` に置いています（同リポジトリ直下には別の Next.js アプリがあるため分離）。
> Godot で開くときは **`game/` フォルダ**（`project.godot` のある場所）をプロジェクトとして開いてください。

## 現在の状態: M0（骨組み）

実装済み:

- プロジェクト設定（SPEC 2章）: viewport 1920×1080、stretch=`canvas_items`/`expand`、テクスチャフィルタ=リニア、`gl_compatibility` レンダラ（Web 向け）。
- Input Map（キーボード＋ゲームパッド）: `move_left` `move_right` `jump` `attack` `dash` `interact` `pause`。
- 物理レイヤ名（SPEC 2章）: world / player / enemy / player_hitbox / enemy_hitbox / hurtbox / interactable。
- ディレクトリ構成（SPEC 3章）。
- Autoload 4つを**枠だけ**登録: `GameState` / `SceneManager` / `DialogueManager` / `AudioManager`。
- プレイヤー（`CharacterBody2D` + ノードベース FSM）: `Idle / Run / Jump / Fall / Dash`。
  - 歩行/走行（アナログ入力の強さで歩き〜走り）、**可変ジャンプ**、コヨーテタイム、ジャンプ入力バッファ、**ダッシュ**（クールダウン付き）。
  - 見た目は単色プレースホルダ（`ColorRect`）。ロジックとビジュアルは分離済みで、後で `AnimationTree` 差し替え可能。
- `Room_01.tscn`: 足場2つ＋**350px の隙間**（ダッシュで越える探索地形）。

まだ未実装（次マイルストーン以降）: 戦闘/敵（M1）、会話・フラグ（M2）、遷移・セーブ・HUD・ポーズ（M3）。
`Attack / Hit` 状態は FSM に追加予定（M1）。

## 動かし方（ローカル / デスクトップ確認）

1. Godot 4.3 以降で `game/` を開く。
2. そのまま実行（F5）。メインシーンは `Room_01.tscn`。
3. 操作:
   - 移動: `A`/`D` または `←`/`→`
   - ジャンプ: `Space`（長押しで高く跳ぶ＝可変ジャンプ）
   - ダッシュ: `Shift`
   - （`attack`=`J` / `interact`=`E` / `pause`=`Esc` は Input Map 登録のみ。挙動は後日）

調整値はすべて `Player` ノードの `@export`（インスペクタ）から変更できます（速度・重力・ジャンプ・ダッシュ等）。

## Web（HTML5）エクスポート ※要ローカル作業

この環境には Godot バイナリが無いため、**Web 書き出しは未実施**です。ローカルで一度通してください（SPEC 12章 M0 の締め）:

1. Godot で `Editor > Manage Export Templates` からテンプレートをダウンロード。
2. `Project > Export... > Add... > Web` でプリセットを作成、`Export Project` で書き出し。
   - `export_presets.cfg` は環境依存のため `.gitignore` 済み。各自で作成してください。
3. itch.io など SharedArrayBuffer 対応のホスティングで確認（COOP/COEP ヘッダ設定に注意、SPEC 2章）。

書き出しが通れば M0 完了。次は M1（戦闘）へ。
