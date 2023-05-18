# ProjectileSpawnerDContext

`ProjectileSpawnerDContext` is a subclass of `DContext` that provides functionality to spawn and control various types of projectiles in a game.

## Nodes

- `projectile`: A reference to a `Projectile` node that is used as a template when spawning new projectiles.
- `units`: A reference to a `LevelUnits` node that is used to keep track of all the units in the game.

## Commands

- `spawn`: A command that triggers the `_spawn` function to create and spawn a new projectile instance.
- `target_point`: A command that triggers the `_target_point` function to add a `PointProjectileStrategy` to the specified projectile, which makes it move to a specified point.
- `target_unit`: A command that triggers the `_target_unit` function to add a `TargetProjectileStrategy` to the specified projectile, which makes it move toward a specified unit.
- `target_vector`: A command that triggers the `_target_vector` function to add a `VectorProjectileStrategy` to the specified projectile, which makes it move in a specified direction.
- `target_homing_vector`: A command that triggers the `_target_homing_vector` function to add a `HomingVectorProjectileStrategy` to the specified projectile, which makes it move in a specified direction and turn towards the nearest unit.
- `cleanup_targeting`: A command that triggers the `_cleanup_targeting` function to remove any child `ProjectileStrategy` nodes from the specified projectile.
- `destroy`: A command that triggers the `_destroy` function to despawn the specified projectile.

## Events

- `before_spawn`: An event that is triggered before a new projectile is spawned.
- `spawned`: An event that is triggered when a new projectile is spawned.
- `collided`: An event that is triggered when the projectile collides with a hitbox.
- `despawned`: An event that is triggered when the projectile is despawned.

## Source

```gd
class_name ProjectileSpawnerDContext
extends DContext

const HomingVectorProjectileStrategy = preload("res://entities/projectile/strategy/strategies/homing_vector.tscn")

# Static nodes
@onready var projectile: Projectile = $Projectile
@onready var units: LevelUnits = NodeSearcher.find_parent_by_type(self, LevelUnits)

# Commands
@onready var spawn = DCommand.new(_spawn)
@onready var target_point = DCommand.new(_target_point)
@onready var target_unit = DCommand.new(_target_unit)
@onready var target_vector = DCommand.new(_target_vector)
@onready var target_homing_vector = DCommand.new(_target_homing_vector)
@onready var cleanup_targeting = DCommand.new(_cleanup_targeting)
@onready var destroy = DCommand.new(_destroy)

# Events
@onready var before_spawn = DEvent.new()
@onready var spawned = DEvent.new()
@onready var collided = DEvent.new()
@onready var despawned = DEvent.new()

func _ready():
    remove_child(projectile)

func _spawn(_payload):
    var spawned_projectile = projectile.duplicate()
    spawned_projectile.collided.connect(self._collided.bind(spawned_projectile))
    spawned_projectile.despawned.connect(self._despawned.bind(spawned_projectile))
    before_spawn.trigger(spawned_projectile)
    units.add_child(spawned_projectile)
    spawned.trigger(spawned_projectile)
    return spawned_projectile

func _target_point(payload):
    var point_strategy = PointProjectileStrategy.new()
    point_strategy.point = payload["Point"]
    payload["Projectile"].add_child(point_strategy)
    point_strategy.name = "PointProjectileStrategy"
    return payload["Projectile"]

func _target_unit(payload):
    var target_strategy = TargetProjectileStrategy.new()
    target_strategy.unit = payload["Unit"]
    payload["Projectile"].add_child(target_strategy)
    target_strategy.name = "TargetProjectileStrategy"
    return payload["Projectile"]

func _target_vector(payload):
    var vector_strategy = VectorProjectileStrategy.new()
    vector_strategy.direction = payload["Vector"].normalized()
    payload["Projectile"].add_child(vector_strategy)
    vector_strategy.name = "VectorProjectileStrategy"
    return payload["Projectile"]

func _target_homing_vector(payload):
    var homing_vector_strategy = HomingVectorProjectileStrategy.instantiate()
    homing_vector_strategy.direction = payload["Vector"].normalized()
    homing_vector_strategy.rotation_angle = payload.get("Angle", 90.0)
    payload["Projectile"].add_child(homing_vector_strategy)
    homing_vector_strategy.name = "HomingVectorProjectileStrategy"
    return payload["Projectile"]

func _cleanup_targeting(payload):
    for child in payload.get_children():
        if child is ProjectileStrategy:
            child.queue_free()
    return payload

func _destroy(projectile_to_destroy):
    projectile_to_destroy.despawn()

func _collided(hitbox, current_projectile):
    collided.trigger({
        "Hitbox": hitbox,
        "Projectile": current_projectile,
    })

func _despawned(current_projectile):
    despawned.trigger(current_projectile)
```
