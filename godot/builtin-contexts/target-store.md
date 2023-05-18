# TargetStoreDContext

`TargetStoreDContext` is a subclass of `DContext` that provides functionality to store and manage targets. Combine this with `AreaDContext` or `ProjectileSpawnerDContext` to take targets, filter the unnecessary ones (e.g. ignore friendly units) and do something with them (strike with `DamageDealerDContext`, apply statuses etc.)

### Instance variables

- `targets`: An instance of `UnitStash` that stores a list of all the targets.

### Computeds

- `target_filter`: A computed property that returns whether the unit is a valid target or not. It always returns true by default, but you can add child nodes that return false upon certain condition.
- `valid_targets`: A computed property that returns a filtered list of valid targets.
- `has_unit`: A computed property that checks if a given unit is present in the `valid_targets`.

### Commands

- `collect`: A command that stores a list of units as targets and triggers the `collected` event with the valid ones.
- `add_one`: A command adds a single target to `targets`. If the target matches the `target_filter`, the function triggers the `added_one` event.
- `add_many`: A command that adds multiple targets to `targets`. If a target matches the `target_filter`, the function triggers the `added_many` event.
- `remove_one`: A command that removes a single target from `targets`. If the target matches the `target_filter`, the function triggers the `removed_one` event.
- `remove_many`: A command that removes multiple targets from `targets`. If a target matches the `target_filter`, the function triggers the `removed_many` event.
- `cleanup`: A command that clears the `targets` list.

### Events

- `collected`: An event that is triggered when the `collect` command is executed to return a list of valid targets.
- `added_one`: An event that is triggered when a single target is added to the `targets` list and the target matches the `target_filter`.
- `removed_one`: An event that is triggered when a single target is removed from the `targets` list and the target matches the `target_filter`.
- `added_many`: An event that is triggered when multiple targets are removed from the `targets` list and at least one of the targets matches the `target_filter`.
- `removed_many`: An event that is triggered when multiple targets are removed from the `targets` list and at least one of the targets matches the `target_filter`.

### Source

```gd
extends DContext

var targets: UnitStash = null

# Computeds
@onready var target_filter = DEvery.new([
	DStatic.new(true)
])
@onready var valid_targets = DPipe.new([
	DMapper.new(func (_x): return targets.get_list()),
	DListFilter.new([
		target_filter
	])
])
@onready var has_unit = DPipe.new([
	DShape.new({
		"Unit": DMapper.get_current(),
		"ValidTargets": valid_targets
	}),
	DMapper.new(func (payload):
		return payload["ValidTargets"].has(payload["Unit"])
		)
])

# Commands
@onready var collect = DCommand.new(_collect)
@onready var add_one = DCommand.new(_add_one)
@onready var add_many = DCommand.new(_add_many)
@onready var remove_one = DCommand.new(_remove_one)
@onready var remove_many = DCommand.new(_remove_many)
@onready var cleanup = DCommand.new(_cleanup)

# Events
@onready var collected = DEvent.new()
@onready var added_one = DEvent.new()
@onready var removed_one = DEvent.new()
@onready var added_many = DEvent.new()
@onready var removed_many = DEvent.new()

func setup_declaration():
	targets = UnitStash.new([])

	return DDeclaration.new([])

func _collect(payload):
	var units: Array[Unit] = []
	for unit in payload:
		units.push_back(unit)
	targets.fill(units)
	var valid_units = valid_targets.trigger(null)
	collected.trigger(valid_units)

func _add_one(payload):
	targets.add(payload)
	if target_filter.trigger(payload):
		added_one.trigger(payload)
	return payload

func _add_many(payload):
	var added = []
	for target in payload:
		add_one.trigger(target)
		if target_filter.trigger(target):
			added.push_back(target)
	if added.size() > 0:
		added_many.trigger(added)
	return payload

func _remove_one(payload):
	targets.remove(payload)
	if target_filter.trigger(payload):
		removed_one.trigger(payload)
	return payload

func _remove_many(payload):
	var removed = []
	for target in payload:
		remove_one.trigger(target)
		if target_filter.trigger(target):
			removed.push_back(target)
	if removed.size() > 0:
		removed_many.trigger(removed)
	return payload

func _cleanup(_payload):
	targets.clear()
```
