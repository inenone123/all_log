extends Node
## BGM/SE の再生窓口。後回し（SPEC 4章）。M0 では枠のみ用意する。

@onready var _bgm_player: AudioStreamPlayer = AudioStreamPlayer.new()
@onready var _se_player: AudioStreamPlayer = AudioStreamPlayer.new()


func _ready() -> void:
	add_child(_bgm_player)
	add_child(_se_player)


func play_bgm(stream: AudioStream) -> void:
	# TODO: フェード等は後日。まずは差し替え可能な窓口だけ用意。
	if stream == null:
		return
	_bgm_player.stream = stream
	_bgm_player.play()


func stop_bgm() -> void:
	_bgm_player.stop()


func play_se(stream: AudioStream) -> void:
	if stream == null:
		return
	_se_player.stream = stream
	_se_player.play()
