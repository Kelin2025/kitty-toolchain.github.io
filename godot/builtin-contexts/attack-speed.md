# AttackSpeedDContext

`AttackSpeedDContext` is a subclass of `DContext` that provides a framework to control the attack speed of a character in a game. It can handle preparations, hits, and a debounce effect, all of which are customizable. Under the hood, it uses three `CooldownDContext` instances. One for hit preparation phase, one for hit duration and one for debounce between hits.

## Stats

- `hit_preparation`: A float representing the amount of time it takes to prepare a hit.
- `hit_duration`: A float representing the amount of time a hit takes.
- `hit_debounce`: A float representing the amount of time between hits.
- `hits_per_second`: A float representing the base number of hits per second.
- `has_preparation`: A boolean indicating whether the attack has a preparation state.

## Static nodes

- `duration`: A `CooldownDContext` object representing the duration of a hit.
- `debounce`: A `CooldownDContext` object representing the debounce between hits.
- `preparation`: A `CooldownDContext` object representing the preparation time before a hit.

## States

- `hit_preparation_state`: A state that represents the actual value of `hit_preparation`.
- `hit_duration_state`: A state that represents the actual value of `hit_duration`.
- `hit_debounce_state`: A state that represents the actual value of `hit_debounce`.
- `hits_per_second_state`: A state that represents the actual value of `hits_per_second`.
- `has_preparation_state`: A state that represents the actual value of `has_preparation`.

## Computeds

- `is_ready`: A computed property that returns true if all of the cooldown timers (i.e., `duration`, `debounce`, and `preparation`) have completed.
- `extra_attack_speed_multiplier`: A computed property that represents additional attack speed bonuses (e.g., bonuses from equipment). You can add child nodes here to add multipliers.
- `calculated_hits_per_second`: A computed property that calculates the hits per second based on the base value (`hits_per_second`) and any additional bonuses from the `extra_attack_speed_multiplier`.

## Events

- `preparation_started`: An event that is triggered when the preparation time for a hit starts.
- `preparation_finished`: An event that is triggered when the preparation time for a hit finishes.
- `duration_started`: An event that is triggered when the duration of a hit starts.
- `duration_finished`: An event that is triggered when the duration of a hit finishes.
- `debounce_started`: An event that is triggered when the debounce effect between hits starts.
- `debounce_finished`: An event that is triggered when the debounce effect between hits finishes.
- `interrupted`: An event that is triggered when an attack is interrupted.

## Pipes

- `start`: A pipe that starts the attack sequence. It determines whether the attack has a preparation state and starts either the preparation or duration timer accordingly.
- `finish_preparation`: A pipe that finishes the preparation timer early.
- `interrupt`: A pipe that interrupts the attack sequence and cleans all of the timers (i.e., `duration`, `debounce`, and `preparation`).

## Source

```gd
class_name AttackSpeedDContext
extends DContext

# Stats
@export var hit_preparation = 0.0
@export var hit_duration = 0.2
@export var hit_debounce = 0.8
@export var hits_per_second = 1.0
@export var has_preparation = false

# Static nodes
@onready var duration: CooldownDContext = $Duration
@onready var debounce: CooldownDContext = $Debounce
@onready var preparation: CooldownDContext = $Preparation

# States
@onready var hit_preparation_state = DState.new(hit_preparation)
@onready var hit_duration_state = DState.new(hit_duration)
@onready var hit_debounce_state = DState.new(hit_debounce)
@onready var hits_per_second_state = DState.new(hits_per_second)
@onready var has_preparation_state = DState.new(has_preparation)

# Computeds
@onready var is_ready = DEvery.new([
	duration.is_ready,
	debounce.is_ready,
	preparation.is_ready
])
@onready var extra_attack_speed_multiplier = DSum.new([])
@onready var calculated_hits_per_second = DPipe.new([
	DProduct.new([
		DState.get_value(hits_per_second_state),
		DSum.new([
			DStatic.new(1),
			extra_attack_speed_multiplier
		])
	])
])

# Events
@onready var preparation_started = DEvent.new()
@onready var preparation_finished = DEvent.new()
@onready var duration_started = DEvent.new()
@onready var duration_finished = DEvent.new()
@onready var debounce_started = DEvent.new()
@onready var debounce_finished = DEvent.new()
@onready var interrupted = DEvent.new()

# Pipes
@onready var start = DPipe.new([
	DCondition.new({
		"If": is_ready,
		"Then": DCondition.new({
			"If": DState.get_value(has_preparation_state),
			"Then": preparation.start_timer,
			"Else": duration.start_timer
		})
	})
])
@onready var finish_preparation = DPipe.new([
	DStatic.new(-1),
	preparation.add_duration_percent
])
@onready var interrupt = DPipe.new([
	interrupted
])

func setup_contexts():
	return {
		"Duration": duration,
		"Debounce": debounce,
		"Preparation": preparation,
	}

func setup_declaration():
	return DDeclaration.new([
		# Preparation step
		DSubscribe.to(preparation.started).do([
			preparation_started
		]),
		DSubscribe.to(preparation.finished).do([
			preparation_finished,
			duration.start_timer
		]),
		# Duration step
		DSubscribe.to(duration.started).do([
			duration_started,
		]),
		DSubscribe.to(duration.finished).do([
			duration_finished,
			debounce.start_timer
		]),
		# Debounce step
		DSubscribe.to(debounce.started).do([
			debounce_started,
		]),
		DSubscribe.to(debounce.finished).do([
			debounce_finished,
		]),
		# Interrupted step
		DSubscribe.to(interrupted).do([
			preparation.clean_timer,
			duration.clean_timer,
			debounce.clean_timer
		])
	])

func sync_durations():
	var hit_preparation_value = hit_preparation_state.get_state()
	var hit_duration_value = hit_duration_state.get_state()
	var hit_debounce_value = hit_debounce_state.get_state()
	var durations_sum_value = hit_preparation_value + hit_duration_value + hit_debounce_value
	var hits_per_second_value = calculated_hits_per_second.trigger(durations_sum_value)

	preparation.duration_state.set_state(hit_preparation_value / durations_sum_value / hits_per_second_value)
	duration.duration_state.set_state(hit_duration_value / durations_sum_value / hits_per_second_value)
	debounce.duration_state.set_state(hit_debounce_value / durations_sum_value / hits_per_second_value)

func _process(_delta):
	if is_initialized:
		sync_durations()
```
