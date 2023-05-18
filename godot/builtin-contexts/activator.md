# ActivatorDContext

ActivatorDContext is a subclass of DContext that has action activation lifecycle logic.

Every action contains Activator context and triggers some of the commands/events automatically, but you can define whenever action should finish in action declaration.

## States

- `is_started`: A boolean state that indicates whether the action is currently casting or not.

## Computeds

- `can_cast`: A computed property that returns true if the context is action is currently available to be activated.

## Commands

- `start`: A command that triggers the `_start` function to set the `is_started` state to true and triggers the `started` event. Called upon action activation.
- `finish`: A command that triggers the `_finish` function to set the `is_started` state to false and triggers the `finished` event. Called upon action finish.
- `release`: A command that triggers the `_release` function and triggers the `released` event. Called whenever player releases the button (only for holdable actions).
- `interrupt`: A command that triggers the `_interrupt` function to trigger the `interrupted` event and call the `finish` command. Called whenever player gets stunned or the action is interrupted due to other reasons.

## Events

- `started`: An event that is triggered via `start` command.
- `finished`: An event that is triggered via `finish` command.
- `released`: An event that is triggered via `release` command.
- `interrupted`: An event that is triggered via `interrupt` command.
- `set_as_active`: Upon certain conditions, action slots can swap between various actions. This event is triggered whenever action appears in any slot, so the player can cast it.

## Source

```gd
class_name ActivatorDContext
extends DContext

# States
@onready var is_started = DState.new(false)

# Computeds
@onready var can_cast = DEvery.new([
    DNot.new([
        DState.get_value(is_started)
    ])
])

# Commands
@onready var start = DCommand.new(_start)
@onready var finish = DCommand.new(_finish)
@onready var release = DCommand.new(_release)
@onready var interrupt = DCommand.new(_interrupt)

# Events
@onready var started = DEvent.new()
@onready var finished = DEvent.new()
@onready var released = DEvent.new()
@onready var interrupted = DEvent.new()
@onready var set_as_active = DEvent.new()

func _start(_payload):
    is_started.set_state(true)
    started.trigger(null)

func _finish(_payload):
    is_started.set_state(false)
    finished.trigger(null)

func _release(_payload):
    released.trigger(null)

func _interrupt(_payload):
    interrupted.trigger(null)
    finish.trigger(null)
```
