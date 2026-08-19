extends Node
## data/dialogues/*.json を読み込み DialogueBox に流す窓口。
## 終了時に GameState のフラグを立てる。M0 では枠のみ、本実装は M2。
##
## 設計方針（SPEC 8章）: 作者は JSON だけ触れば会話を追加できる。
## コード側は「未知の id・欠損データでも落ちない」よう防御的に扱うこと。

const DIALOGUE_DIR: String = "res://data/dialogues/"

signal dialogue_started(dialogue_id: String)
signal dialogue_finished(dialogue_id: String)


func start_dialogue(dialogue_id: String) -> void:
	# TODO(M2): JSON をロードし DialogueBox に行を流す。on_end.set_flags を GameState に反映。
	var data: Dictionary = _load_dialogue(dialogue_id)
	if data.is_empty():
		push_warning("DialogueManager: 会話データが見つからない id=%s" % dialogue_id)
		return
	dialogue_started.emit(dialogue_id)


## 未知の id・壊れた JSON でも落ちないローダー。空 Dictionary を返して呼び出し側で判定させる。
func _load_dialogue(dialogue_id: String) -> Dictionary:
	var path: String = DIALOGUE_DIR + dialogue_id + ".json"
	if not FileAccess.file_exists(path):
		return {}
	var text: String = FileAccess.get_file_as_string(path)
	var parsed: Variant = JSON.parse_string(text)
	if parsed is Dictionary:
		return parsed
	return {}
