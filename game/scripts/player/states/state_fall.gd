extends State
## 落下中。コヨーテタイムでのジャンプ、着地前のジャンプ先読み（バッファ）を扱う。

func physics_update(delta: float) -> void:
	player.apply_gravity(delta)

	var input: float = player.get_move_input()
	player.update_facing(input)
	player.velocity.x = player.ground_speed(input)

	# ジャンプ入力: コヨーテ中なら即ジャンプ、そうでなければ着地に備えてバッファ。
	if Input.is_action_just_pressed("jump"):
		if player.has_coyote():
			player.start_jump()
			state_machine.transition_to("Jump")
			return
		else:
			player.buffer_jump()

	if Input.is_action_just_pressed("dash") and player.can_dash():
		state_machine.transition_to("Dash")
		return

	if player.is_on_floor():
		if player.consume_jump_buffer():
			player.start_jump()
			state_machine.transition_to("Jump")
		elif input != 0.0:
			state_machine.transition_to("Run")
		else:
			state_machine.transition_to("Idle")
