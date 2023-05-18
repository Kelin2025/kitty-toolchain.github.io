# RemoteAreaDContext

`RemoteAreaDContext` is a subclass of `DContext` that is responsible for managing a remote area in a game. It contains various commands and events that can be used to modify and interact with the area.

The difference between this and `AreaDContext` is that `RemoteAreaDContext` can spawn multiple areas simultaneously and they don't move with unit that controls it. Use it for AoE zones that shouldn't follow the caster or if you need multiple areas at the same time.

## Static nodes

- `area`: A reference to the `Area` node that represents the actual area in the game.
- `level`: A reference to the `Level` node that is the parent of this context.

## Commands

- `spawn_at`: A command that creates a new instance of the `Area` node at the specified global position, adds it as a child of `level.zones`, and triggers the `spawned` event.
- `start_preparation`: A command that sets the `Preparation` child node of the `Area` node to visible and returns the payload.
- `stop_preparation`: A command that sets the `Preparation` child node of the `Area` node to invisible and returns the payload.
- `enable`: A command that starts tracking units that enter the area and sets the `Display` child node of the `Area` node to visible.
- `disable`: A command that stops tracking units that enter the area and sets the `Display` child node of the `Area` node to invisible.
- `despawn`: A command that removes the specified `Area` instance from the game and triggers the `despawned` event.

## Events

- `spawned`: An event that is triggered when a new instance of the `Area` node is created via `spawn_at`.
- `enabled`: An event that is triggered when the area is enabled and starts tracking units that enter.
- `units_affected`: An event that is triggered when the area is enabled and a unit enters the area.
- `entered`: An event that is triggered when a unit enters the area.
- `exited`: An event that is triggered when a unit exits the area.
- `disabled`: An event that is triggered when the area stops tracking units that enter.

## Source

```gd
class_name RemoteAreaDContext
extends DContext

# Static nodes
@onready var area = $Area
@onready var level: Level = NodeSearcher.find_parent_by_type(self, Level)

# Commands
@onready var spawn_at = DCommand.new(_spawn_at)
@onready var start_preparation = DCommand.new(_start_preparation)
@onready var stop_preparation = DCommand.new(_stop_preparation)
@onready var enable = DCommand.new(_enable)
@onready var disable = DCommand.new(_disable)
@onready var despawn = DCommand.new(_despawn)

# Events
@onready var spawned = DEvent.new()
@onready var enabled = DEvent.new()
@onready var units_affected = DEvent.new()
@onready var entered = DEvent.new()
@onready var exited = DEvent.new()
@onready var disabled = DEvent.new()
@onready var despawned = DEvent.new()

func _start_preparation(payload):
    payload.get_node("Preparation").visible = true
    return payload

func _stop_preparation(payload):
    payload.get_node("Preparation").visible = false
    return payload

func _spawn_at(payload):
    var area_clone = area.duplicate()
    area_clone.enabled.connect(_enabled.bind(area_clone))
    area_clone.unit_entered.connect(_unit_entered.bind(area_clone))
    area_clone.unit_exited.connect(_unit_exited.bind(area_clone))
    area_clone.disabled.connect(_disabled.bind(area_clone))
    level.zones.add_child(area_clone)
    area_clone.global_position = payload
    spawned.trigger(area_clone)
    return area_clone

func _despawn(payload):
    despawned.trigger(payload)
    payload.queue_free()

func _enable(payload):
    payload.start_tracking()
    payload.get_node("Display").visible = true
    return payload

func _disable(payload):
    payload.stop_tracking()
    payload.get_node("Display").visible = false
    return payload

func _enabled(area_clone):
    enabled.trigger(area_clone)
    await get_tree().physics_frame
    units_affected.trigger(area_clone.get_units())

func _disabled(area_clone):
    disabled.trigger(area_clone)

func _unit_entered(unit, area_clone):
    entered.trigger({
        "Area": area_clone,
        "Unit": unit
    })

func _unit_exited(unit, area_clone):
    exited.trigger({
        "Area": area_clone,
        "Unit": unit
    })
```
