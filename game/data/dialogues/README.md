# 会話データ（作者が編集する場所）

SPEC.md 8章のスキーマに従い、`*.json` を1ファイル1会話で置く。
**中身（セリフ・物語）は作者が書く。** コード側は未知の id・欠損でも落ちないよう防御的に扱う（`DialogueManager`）。

## スキーマ

```json
{
  "id": "会話ID（ファイル名と揃える）",
  "lines": [
    { "speaker": "話者名", "text": "本文" }
  ],
  "choices": [],
  "on_end": { "set_flags": ["立てるフラグ名"] }
}
```

- `lines`: `speaker` / `text` の連なり。
- `choices`（任意）: `[{ "text": "…", "goto": "別の会話ID" }]` で分岐。縦の断面では未使用でも枠だけ用意。
- `on_end.set_flags`: 会話終了時に `GameState` へ立てるフラグ。

`_example.json` は仕組み確認用のダミー。物語には使わない。
