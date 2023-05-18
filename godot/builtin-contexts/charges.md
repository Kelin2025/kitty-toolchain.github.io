# ChargesDContext

ChargesDContext is a subclass of DContext that allows you to control charges and their consumption and restoration.

## Stats

- `max_charges`: An exported integer that defines the maximum number of charges available.

## States

- `current_charges`: A state that represents the current number of charges.
- `max_charges_state`: A state that represents the maximum number of charges.

## Computeds

- `has_charges`: A computed property that returns true if the current number of charges is greater than 0.
- `has_specific_charges_count`: A computed property that returns true if the current number of charges is greater than or equal to a specified number.
- `has_full_charges`: A computed property that returns true if the current number of charges is equal to or greater than the maximum number of charges.
- `has_extra_charges`: A computed property that returns true if the current number of charges is greater than the maximum number of charges.
- `missing_charges`: A computed property that returns the number of missing charges required to reach the maximum amount of charges available.

## Commands

- `spend_charges`: A command that triggers the `_spend_charges` function to spend a specified number of charges and triggers the `spent` event.
- `restore_charges`: A command that triggers the `_restore_charges` function to restore a specified number of charges and triggers the `restored` event.
- `add_extra_charges`: A command that triggers the `_add_extra_charges` function to add additional charges beyond the maximum limit and triggers the `restored` event.
- `change_max_count`: A command that triggers the `_change_max_count` function to change the maximum number of charges and triggers the `max_count_changed` event.

## Events

- `spent`: An event that is triggered when charges are spent via the `spend_charges` command.
- `restored`: An event that is triggered when charges are restored via the `restore_charges` or `add_extra_charges` commands.
- `max_count_changed`: An event that is triggered when the maximum number of charges is changed via the `change_max_count` command.

This codebase provides a versatile framework for managing charges and their usage and restoration in various applications, such as games or other resource management systems.

## Source

```gd
class_name ChargesDContext
extends DContext

# Stats
@export var max_charges = 0

# States
@onready var current_charges = DState.new(max_charges)
@onready var max_charges_state = DState.new(max_charges)

# Computeds
@onready var has_charges = DPipe.new([
	DState.get_value(current_charges),
	DMapper.new(func (charges): return charges > 0)
])
@onready var has_specific_charges_count = DPipe.new([
	DShape.new({
		"Current": DState.get_value(current_charges),
		"Required": DMapper.get_current()
	}),
	DMapper.new(func (payload): return payload["Current"] >= payload["Required"])
])
@onready var has_full_charges = DPipe.new([
	DShape.new({
		"Current": DState.get_value(current_charges),
		"Max": DState.get_value(max_charges_state),
	}),
	DMapper.new(func (payload): return payload["Current"] >= payload["Max"]),
])
@onready var has_extra_charges = DPipe.new([
	DShape.new({
		"Current": DState.get_value(current_charges),
		"Max": DState.get_value(max_charges_state),
	}),
	DMapper.new(func (payload): return payload["Current"] > payload["Max"]),
])
@onready var missing_charges = DPipe.new([
	DCondition.new({
		"If": has_full_charges,
		"Then": 0,
		"Else": [
			DShape.new({
				"Current": DState.get_value(current_charges),
				"Max": DState.get_value(max_charges_state),
			}),
			DMapper.new(func (payload): return payload["Max"] - payload["Current"])
		]
	})
])

# Commands
@onready var spend_charges = DCommand.new(_spend_charges)
@onready var restore_charges = DCommand.new(_restore_charges)
@onready var add_extra_charges = DCommand.new(_add_extra_charges)
@onready var change_max_count = DCommand.new(_change_max_count)

# Events
@onready var spent = DEvent.new()
@onready var restored = DEvent.new()
@onready var max_count_changed = DEvent.new()

func _spend_charges(count):
	var current = current_charges.get_state()
	var capped_charges = max(0, current - count)
	var actually_spent = current - capped_charges
	current_charges.set_state(capped_charges)
	spent.trigger(actually_spent)

func _restore_charges(count):
	var current = current_charges.get_state()
	var capped_charges = min(max_charges_state.get_state(), current + count)
	var actually_restored = capped_charges - current
	current_charges.set_state(capped_charges)
	restored.trigger(actually_restored)

func _add_extra_charges(count):
	var current = current_charges.get_state()
	var next_count = current + count
	current_charges.set_state(next_count)
	restored.trigger(next_count)

func _change_max_count(count):
	max_charges_state.set_state(count)
	current_charges.set_state(count)
	max_count_changed.trigger(count)
```
