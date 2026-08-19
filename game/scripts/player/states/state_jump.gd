extends State
## 上昇中。可変ジャンプ（ボタンを離すと上昇カット）と空中横移動を扱う。

func physics_update(delta: float) -> void:
	player.apply_gravity(delta)

	# 可変ジャンプ: 上昇中にボタンを離したら上昇速度を削る。
	if Input.is_action_just_released("jump") and player.velocity.y < 0.0:
		player.velocity.y *= player.jump_cut_factor

	var input: float = player.get_move_input()
	player.update_facing(input)
	player.velocity.x = player.ground_speed(input)

	if Input.is_action_just_pressed("dash") and player.can_dash():
		state_machine.transition_to("Dash")
	elif player.velocity.y >= 0.0:
		state_machine.transition_to("Fall")
