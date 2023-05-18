# CooldownDContext

`CooldownDContext` is a subclass of `DContext` that provides a cooldown timer functionality, allowing a user to delay the execution of a function for a specified duration. Despite the name, it can be used for any sort of timers. Duration, cooldown, debounce - whatever.

## Stats

- `duration`: A defined time in seconds for how long the cooldown should last.
- `is_recursive`: A boolean that determines whether the cooldown should execute recursively.

## Internals

- `timer`: A `Timer` object that is used to execute the trigger function after the cooldown duration has passed.

## States

- `is_pending`: A state that indicates whether the cooldown is currently pending and has not expired yet.
- `duration_state`: A state that holds the duration of timer.
- `is_recursive_state`: A state that indicates whether timer will start again after finish or not.

## Computeds

- `duration_middleware`: A computed property that returns a value that is added to duration.
- `calculated_duration`: A computed property that calculates the final duration value to use based on the `duration_state` and the `duration_middleware` value.
- `is_ready`: A computed property that returns true if the cooldown is not currently pending.

## Commands

- `start_timer`: A command starts the cooldown timer.
- `clean_timer`: A command removes the timer instance and reset the cooldown.
- `add_duration`: A command that adds a specified time to the current cooldown duration.
- `add_duration_percent`: A command that changes the remaining duration by a specified percentage.

## Events

- `started`: An event that is triggered when the cooldown is started.
- `recursive_tick`: An event that is triggered upon cooldown finish if it's recursive.
- `finished`: An event that is triggered when the cooldown has completed.

## Pipes

- `finish_early`: Finishes currently running timer (if exists).

## Source

```gd
class_name CooldownDContext
extends DContext

# Stats
@export var duration = 1.0
@export var is_recursive = false

# Internals
@onready var timer: Timer = null

# States
@onready var is_pending = DState.new(false)
@onready var duration_state = DState.new(duration)
@onready var is_recursive_state = DState.new(is_recursive)

# Computeds
@onready var duration_middleware = DSum.new([])
@onready var calculated_duration = DPipe.new([
    DSum.new([
        DState.get_value(duration_state),
        duration_middleware
    ])
])
@onready var is_ready = DNot.new([
    DState.get_value(is_pending)
])

# Commands
@onready var start_timer = DCommand.new(_start_timer)
@onready var clean_timer = DCommand.new(_clean_timer)
@onready var add_duration = DCommand.new(_add_duration)
@onready var add_duration_percent = DCommand.new(_add_duration_percent)

# Events
@onready var started = DEvent.new()
@onready var recursive_tick = DEvent.new()
@onready var finished = DEvent.new()

# Pipes
@onready var finish_early = DPipe.new([
    DStatic.new(-1),
    add_duration_percent
])

func _start_timer(_payload):
    clean_timer.trigger(null)
    var timer_duration = duration_state.get_state()
    var mapped_duration = calculated_duration.trigger(timer_duration)
    timer_duration = timer_duration if mapped_duration == null else mapped_duration
    timer = Timer.new()
    timer.wait_time = timer_duration
    if !is_recursive_state.get_state():
        timer.one_shot = true
    add_child(timer)
    timer.timeout.connect(_timer_finished.bind(timer))
    timer.start()
    is_pending.set_state(true)
    started.trigger(null)

func _clean_timer(_payload):
    if is_pending.get_state():
        timer.queue_free()
        timer = null
        is_pending.set_state(false)

func _add_duration(payload):
    if is_pending.get_state():
        var next_time = timer.time_left + payload
        if next_time <= 0:
            clean_timer.trigger(null)
            finished.trigger(null)
        else:
            timer.start(next_time)

func _add_duration_percent(payload):
    if is_pending.get_state():
        var next_time = timer.time_left + timer.time_left * payload
        if next_time <= 0:
            clean_timer.trigger(null)
            finished.trigger(null)
        else:
            timer.start(next_time)

func _timer_finished(_timer):
    if is_recursive_state.get_state():
        recursive_tick.trigger(null)
        if timer:
            var timer_duration = duration_state.get_state()
            var mapped_duration = calculated_duration.trigger(timer_duration)
            timer.start(mapped_duration)
    else:
        clean_timer.trigger(null)
        finished.trigger(null)
```
