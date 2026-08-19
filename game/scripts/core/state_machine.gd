class_name StateMachine
extends Node
## ノードベース FSM（SPEC 4章）。
## 子ノードの State を集め、名前（小文字）で遷移する。
## 新アクションは State の子ノードを足すだけで拡張できる。

## 初期状態。未設定なら最初の State 子ノードを使う。
@export var initial_state: State

var current_state: State
var _states: Dictionary = {}


## Player から呼ばれ、各 State に参照を注入して初期状態へ入る。
func setup(owner_player: Player) -> void:
	for child in get_children():
		if child is State:
			var s: State = child
			s.player = owner_player
			s.state_machine = self
			_states[child.name.to_lower()] = s
	if initial_state == null:
		for child in get_children():
			if child is State:
				initial_state = child
				break
	current_state = initial_state
	if current_state != null:
		current_state.enter()


## 状態遷移。未知の名前は警告して無視（防御的）。
func transition_to(state_name: String) -> void:
	var key: String = state_name.to_lower()
	if not _states.has(key):
		push_warning("StateMachine: 未知の状態 '%s' への遷移を無視" % state_name)
		return
	if current_state != null:
		current_state.exit()
	current_state = _states[key]
	current_state.enter()


func physics_update(delta: float) -> void:
	if current_state != null:
		current_state.physics_update(delta)


func handle_input(event: InputEvent) -> void:
	if current_state != null:
		current_state.handle_input(event)
