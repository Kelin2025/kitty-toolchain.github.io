# AreaDContext

`AreaDContext` is a subclass of `DContext` that represents a designated area within the game environment. It provides the ability to interact with the area, toggle its visibility, enable/disable tracking of units within it, and handle various events. It's used for hitboxes, AoE zones, etc.

## Static nodes

- `area`: A reference to the `Area2D` node.

## Commands

- `start_preparation`: Makes the `Preparation` node in the `Area` visible.
- `stop_preparation`: Makes `Preparation` node in the `Area` invisible.
- `enable`: Starts tracking units in the `Area` and makes the `Display` node in the `Area` visible.
- `disable`: Stops tracking units in the `Area` and makes the `Display` node in the `Area` invisible.

## Events

- `enabled`: An event that is triggered when the `Area` is enabled via the `enable` command. It triggers the `units_affected` event and passes the `Area` node and the list of affected units to it.
- `units_affected`: An event that is triggered by the `enabled` event and takes in the `Area` node and the list of affected units as its arguments.
- `entered`: An event that is triggered when a body enters the `Area` and passes the entered `Area` node as its argument.
- `exited`: An event that is triggered when a body exits the `Area` and passes the exited `Area` node as its argument.
- `disabled`: An event that is triggered when the `Area` is disabled via the `disable` command.

## Source

```gd
class_name AreaDContext
extends DContext

# Static nodes
@onready var area = $Area

# Commands
@onready var start_preparation = DCommand.new(_start_preparation)
@onready var stop_preparation = DCommand.new(_stop_preparation)
@onready var enable = DCommand.new(_enable)
@onready var disable = DCommand.new(_disable)

# Events
@onready var enabled = DEvent.new()
@onready var units_affected = DEvent.new()
@onready var entered = DEvent.new()
@onready var exited = DEvent.new()
@onready var disabled = DEvent.new()

func _ready():
    area.enabled.connect(_enabled)
    area.disabled.connect(_disabled)
    area.area_entered.connect(_area_area_entered)
    area.area_exited.connect(_area_area_exited)
    area.body_entered.connect(_area_body_entered)
    area.body_exited.connect(_area_body_exited)

func _start_preparation(_payload):
    area.get_node("Preparation").visible = true

func _stop_preparation(_payload):
    area.get_node("Preparation").visible = false

func _enable(_payload):
    area.start_tracking()
    area.get_node("Display").visible = true

func _disable(_payload):
    area.stop_tracking()
    area.get_node("Display").visible = false

func _enabled():
    enabled.trigger(area)
    units_affected.trigger(area.get_units())

func _disabled():
    disabled.trigger(area)

func _area_area_entered(entered_area):
    entered.trigger(entered_area)

func _area_area_exited(exited_area):
    exited.trigger(exited_area)

func _area_body_entered(body):
    if body is Unit:
        entered.trigger(body.body_collision)

func _area_body_exited(body):
    if body is Unit:
        exited.trigger(body.body_collision)
```
