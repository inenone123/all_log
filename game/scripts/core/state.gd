class_name State
extends Node
## ノードベース FSM の基底状態（SPEC 4章）。
## 各具体状態はこれを継承し、必要な仮想メソッドだけ上書きする。
## ゲームロジックはここ（State）に置き、ビジュアルは AnimationTree 側で state 名に紐づける想定。

## 所属する StateMachine（setup 時に注入）。
var state_machine: StateMachine
## 操作対象のプレイヤー（setup 時に注入）。
var player: Player


## 状態に入った瞬間の初期化。
func enter() -> void:
	pass


## 状態を抜ける瞬間の後始末。
func exit() -> void:
	pass


## 入力イベント（_unhandled_input 経由）。
func handle_input(_event: InputEvent) -> void:
	pass


## 物理フレーム更新。velocity を組み立てる（move_and_slide は Player 側で呼ぶ）。
func physics_update(_delta: float) -> void:
	pass
