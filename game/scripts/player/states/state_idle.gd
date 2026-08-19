extends State
## 待機。接地して停止している状態。

func physics_update(delta: float) -> void:
	player.apply_gravity(delta)
	player.velocity.x = 0.0

	var input: float = player.get_move_input()
	player.update_facing(input)

	if not player.is_on_floor():
		state_machine.transition_to("Fall")
	elif Input.is_action_just_pressed("dash") and player.can_dash():
		state_machine.transition_to("Dash")
	elif Input.is_action_just_pressed("jump"):
		player.start_jump()
		state_machine.transition_to("Jump")
	elif input != 0.0:
		state_machine.transition_to("Run")
