class_name Player
extends CharacterBody2D
## プレイヤー本体。CharacterBody2D + ノードベース FSM（SPEC 4/7章）。
## 調整値はすべて @export でエディタから触れる。マジックナンバーを状態側に埋めない。
## 操作感（キビキビ感）最優先。数値は後で詰める前提。

# --- 移動 ---
@export var walk_speed: float = 200.0       ## 歩行（アナログ弱入力）
@export var run_speed: float = 320.0         ## 走行（フル入力）
# --- 重力・落下 ---
@export var gravity: float = 1500.0
@export var max_fall_speed: float = 900.0
# --- ジャンプ ---
@export var jump_velocity: float = 520.0     ## ジャンプ初速
@export var jump_cut_factor: float = 0.5     ## 可変ジャンプ: ボタンを離した時の上昇速度倍率
@export var coyote_time: float = 0.1         ## 地面を離れてからジャンプ可能な猶予
@export var jump_buffer_time: float = 0.1    ## 着地前にジャンプ入力を先読みする猶予
# --- ダッシュ（探索アクション）---
@export var dash_speed: float = 600.0
@export var dash_duration: float = 0.18
@export var dash_cooldown: float = 0.4

@onready var state_machine: StateMachine = $StateMachine

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var dash_cooldown_timer: float = 0.0
var facing: int = 1  ## 1:右 / -1:左


func _ready() -> void:
	state_machine.setup(self)


func _unhandled_input(event: InputEvent) -> void:
	state_machine.handle_input(event)


func _physics_process(delta: float) -> void:
	_update_timers(delta)
	state_machine.physics_update(delta)
	move_and_slide()


func _update_timers(delta: float) -> void:
	if is_on_floor():
		coyote_timer = coyote_time
	else:
		coyote_timer = maxf(coyote_timer - delta, 0.0)
	jump_buffer_timer = maxf(jump_buffer_timer - delta, 0.0)
	dash_cooldown_timer = maxf(dash_cooldown_timer - delta, 0.0)


# --- 状態から使う共通ヘルパー ---

## -1.0〜1.0 の横入力（キーボードは±1、ゲームパッドはアナログ）。
func get_move_input() -> float:
	return Input.get_axis("move_left", "move_right")


## 入力の強さに応じて歩行〜走行の速度を返す（フル入力=走行、弱入力=歩行）。
func ground_speed(input: float) -> float:
	var mag: float = absf(input)
	return signf(input) * lerpf(walk_speed, run_speed, mag)


func update_facing(input: float) -> void:
	if input != 0.0:
		facing = 1 if input > 0.0 else -1


func apply_gravity(delta: float) -> void:
	velocity.y = minf(velocity.y + gravity * delta, max_fall_speed)


func start_jump() -> void:
	velocity.y = -jump_velocity
	coyote_timer = 0.0
	jump_buffer_timer = 0.0


func can_dash() -> bool:
	return dash_cooldown_timer <= 0.0


func buffer_jump() -> void:
	jump_buffer_timer = jump_buffer_time


func consume_jump_buffer() -> bool:
	if jump_buffer_timer > 0.0:
		jump_buffer_timer = 0.0
		return true
	return false


func has_coyote() -> bool:
	return coyote_timer > 0.0
