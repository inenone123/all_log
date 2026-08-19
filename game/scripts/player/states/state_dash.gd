extends State
## ダッシュ（探索アクション、SPEC 6/7章）。
## 一定時間、向いている方向へ高速移動する。重力は無効にしてキビキビ動かす。

var _timer: float = 0.0
var _dir: int = 1


func enter() -> void:
	# 入力があればその向き、なければ現在の向きへダッシュ。
	var input: float = player.get_move_input()
	if input != 0.0:
		_dir = 1 if input > 0.0 else -1
		player.facing = _dir
	else:
		_dir = player.facing
	_timer = player.dash_duration
	player.dash_cooldown_timer = player.dash_cooldown
	player.velocity = Vector2(_dir * player.dash_speed, 0.0)


func physics_update(delta: float) -> void:
	# ダッシュ中は重力を切り、水平速度を維持（隙間越え用）。
	player.velocity = Vector2(_dir * player.dash_speed, 0.0)
	_timer -= delta
	if _timer <= 0.0:
		_end_dash()


func _end_dash() -> void:
	if not player.is_on_floor():
		state_machine.transition_to("Fall")
	elif player.get_move_input() != 0.0:
		state_machine.transition_to("Run")
	else:
		state_machine.transition_to("Idle")
