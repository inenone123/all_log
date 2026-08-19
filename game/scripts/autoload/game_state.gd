extends Node
## ストーリーフラグ・進行状態・プレイヤーの永続ステータス・セーブ/ロードの窓口。
## M0 では枠のみ。フラグ操作の最小 API だけ用意し、本実装は M2/M3。

## 会話などで立てる進行フラグ（例: "met_villager": true）。
var flags: Dictionary = {}
## 現在のルーム（セーブ/ロード用）。
var current_room_path: String = ""
## 直近のスポーン地点名。
var spawn_point: String = ""
## プレイヤーの永続ステータス（HP など。M1 以降で使用）。
var player_stats: Dictionary = {}


func set_flag(flag: String, value: bool = true) -> void:
	flags[flag] = value


func has_flag(flag: String) -> bool:
	return flags.get(flag, false)


func save() -> void:
	# TODO(M3): user://save_0.json へ current_room_path / spawn_point / flags / player_stats を書き出す。
	pass


func load_game() -> void:
	# TODO(M3): 起動時にセーブが存在すれば復元する。
	pass
