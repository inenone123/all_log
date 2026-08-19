extends Node
## ルーム間遷移（フェード付き）とプレイヤー状態の受け渡しを担当。
## M0 では枠のみ。本実装は M3。

signal room_changed(room_path: String, spawn_point: String)


func change_room(room_path: String, spawn_point: String = "") -> void:
	# TODO(M3): フェードアウト → ロード → spawn_point に配置 → フェードイン。
	# プレイヤーの HP 等は GameState 経由で保持する。
	GameState.current_room_path = room_path
	GameState.spawn_point = spawn_point
	room_changed.emit(room_path, spawn_point)
