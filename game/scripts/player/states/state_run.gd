extends State
## 移動（歩行/走行）。接地して横入力がある状態。

func physics_update(delta: float) -> void:
	player.apply_gravity(delta)

	var input: float = player.get_move_input()
	player.update_facing(input)
	player.velocity.x = player.ground_speed(input)

	if not player.is_on_floor():
		state_machine.transition_to("Fall")
	elif Input.is_action_just_pressed("dash") and player.can_dash():
		state_machine.transition_to("Dash")
	elif Input.is_action_just_pressed("jump"):
		player.start_jump()
		state_machine.transition_to("Jump")
	elif input == 0.0:
		state_machine.transition_to("Idle")
