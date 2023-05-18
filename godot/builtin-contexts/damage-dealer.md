# DamageDealerDContext

`DamageDealerDContext` is a subclass of `DContext` that represents a damage dealer. It has various stats that control the amount and type of damage that can be dealt. Damage dealer is used for anything that should deal damage.

## Stats

- `base_damage`: The base damage dealt by the dealer.
- `poise_damage`: The amount of additional poise damage dealt by the dealer.
- `damage_type`: The type of damage dealt.
- `range_type`: The type of attack range.
- `crit_chance`: The chance of scoring a critical hit.
- `is_lethal`: Whether the attack is lethal or not.
- `is_vampiric`: Whether the attack heals the dealer.

## States

- `base_damage_state`: A state that represents base damage.
- `poise_damage_state`: A state that represents poise damage. If it's more than 0, target receives micro-stun and increases his poise by this amount. If target's poise exceeds certain threshold, they become immune to micro-stun for a brief period.
- `damage_type_state`: A state that represents damage type. Possible values: `DamageTransaction.DamageType.Physical`, `DamageTransaction.DamageType.Magic`, `DamageTransaction.DamageType.Pure`.
- `range_type_state`: A state that represents range type. Possible values: `DamageTransaction.AttackType.Melee`, `DamageTransaction.AttackType.Ranged`.
- `crit_chance_state`: A state that represents critical strike chance.
- `is_lethal_state`: A stat that indicates whether the damage should be lethal or keep 1 hp minimum.
- `is_vampiric_state`: A state that represents the current `is_vampiric` value.

## Computeds

- `calculated_base_damage`: A computed property that returns the current `base_damage` value. You can add child nodes to modify this value.
- `calculated_damage_multiplier`: A computed property that returns the total damage multiplier. You can add child nodes to modify multiplier.
- `calculated_crit_chance`: A computed property that returns the added `crit_chance` value. You can add child nodes to modify chance.
- `should_crit`: A computed property that returns true if a critical hit should be inflicted. You can add child node that returns true/false upon certain condition, if you want to enforce it.

## Commands

- `strike`: A command that triggers the `_strike` function. It creates a new `DamageTransaction` object and calculates the amount and type of damage to deal. It triggers the `before_strike` and `strike_commited` events.
- `set_base_damage`: A command that triggers the `_set_base_damage` function. It sets the `base_damage` value to the specified value.

## Events

- `before_strike`: An event that is triggered before the dealer strikes a target. Receives `DamageTransaction` as a payload.
- `strike_commited`: An event that is triggered once the strike has been committed. Receives `DamageTransaction` as a payload.

## Source

```gd
class_name DamageDealerDContext
extends DContext

# Stats
@export var base_damage = 100.0
@export var poise_damage = 10.0
@export var damage_type = DamageTransaction.DamageType.Physical
@export var range_type = DamageTransaction.AttackType.Melee
@export var crit_chance = 0.0
@export var is_lethal = true
@export var is_vampiric = true

# States
@onready var base_damage_state = DState.new(base_damage)
@onready var poise_damage_state = DState.new(poise_damage)
@onready var damage_type_state = DState.new(damage_type)
@onready var range_type_state = DState.new(range_type)
@onready var crit_chance_state = DState.new(crit_chance)
@onready var is_lethal_state = DState.new(is_lethal)
@onready var is_vampiric_state = DState.new(is_vampiric)

# Computeds
@onready var calculated_base_damage = DPipe.new([
    DState.get_value(base_damage_state)
])
@onready var calculated_damage_multiplier = DSum.new([
    DStatic.new(1)
])
@onready var calculated_crit_chance = DSum.new([
    DState.get_value(crit_chance_state)
])
@onready var should_crit = DSome.new([
    RandomMacros.should_proc(calculated_crit_chance),
    DStatic.new(false)
])

# Commands
@onready var strike = DCommand.new(_strike)
@onready var set_base_damage = DCommand.new(_set_base_damage)

# Events
@onready var before_strike = DEvent.new()
@onready var strike_commited = DEvent.new()

func _strike(payload):
    var damage_transaction = DamageTransaction.new()
    damage_transaction.from(payload["Dealer"])
    damage_transaction.to(payload["Receiver"])
    damage_transaction.type(damage_type_state.get_state())
    damage_transaction.attack_range(range_type_state.get_state())
    damage_transaction.damage(calculated_base_damage.trigger({
        "Transaction": damage_transaction,
        "Context": payload.get("Context", {})
    }))
    damage_transaction.vampiric(is_vampiric_state.get_state())
    damage_transaction.poise(poise_damage_state.get_state())
    damage_transaction.should_be_lethal(is_lethal_state.get_state())
    damage_transaction.damage_multiplier = calculated_damage_multiplier.trigger({
        "Transaction": damage_transaction,
        "Context": payload.get("Context", {})
    })
    if "ExtraMultiplier" in payload:
        damage_transaction.add_multiplier(payload["ExtraMultiplier"])
    damage_transaction.critical(should_crit.trigger({
        "Transaction": damage_transaction,
        "Context": payload.get("Context", {})
    }))
    before_strike.trigger({
        "Transaction": damage_transaction,
        "Context": payload.get("Context", {})
    })
    damage_transaction.commit()
    strike_commited.trigger({
        "Transaction": damage_transaction,
        "Commited": damage_transaction.commited,
        "Context": payload.get("Context", {})
    })

func _set_base_damage(payload):
    base_damage_state.set_state(payload)
```
