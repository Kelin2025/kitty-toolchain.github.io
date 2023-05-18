# About Dodec

Engine: Godot 4. Language: GDScript.

I've written a custom library to describe game logic in a declarative way. I call it Dodec. The key point here is that it's an instruction, not a declaration that contains the instruction of what will be happening after its trigger.

## Core classes

## Built-in DContext classes

There are various built-in DContext classes that act as building blocks for actions and perks. Follow the links to read more about them:

- [ActivatorDContext](builtin-contexts/activator.md)
- [AreaDContext](builtin-contexts/area.md)
- [ChargesDContext](builtin-contexts/charges.md)
- [CooldownDContext](builtin-contexts/cooldown.md)
- [DamageDealerDContext](builtin-contexts/damage-dealer.md)
- [ProjectileSpawnerDContext](builtin-contexts/projectile-spawner.md)
- [RemoteAreaDContext](builtin-contexts/remote-area.md)
- [TargetStoreDContext](builtin-contexts/target-store.md)
- [AttackSpeedDContext](builtin-contexts/attack-speed.md)

### DContext

It's a class that contains Dodec declaration and some other instances.

Example:

```gd
extends DContext

# Pipes
@onready var print_number = DPipe.new([
  DApply.new(func (x): print(x))
])

# Events
@onready var button_pressed = DEvent.new()

func setup_declaration():
  return DDeclaration.new([
    DSubscribe.to(button_pressed).do([
      print_number
    ])
  ])

# This method is called after setup_declaration is triggered
func _bindings_initialized():
  pass

```

### DTrigger

The first key thing is the `DTrigger` class:

```gd
class_name DTrigger

func trigger(payload, declaration):
  # Do something here
  # Return response
  return response

```

The `DTrigger` instance itself doesn't call its trigger method on instance creation. It gets called by `declaration.trigger(payload)`. I create various operators by extending from the DTrigger class and writing specific triggers.

### DDeclaration

`DDeclaration` is a class that accepts an array of DTrigger instances and stores them. It has a trigger method to trigger all DTrigger instances.

Template of a declaration:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    # Describe a logic by adding necessary `DTrigger` instances here
  ])

func _bindings_initialized():
  # Will call all `DTrigger` instances passed to declaration with 5 as payload
  declaration.trigger(5)

```

Let's take a look at some of the most commonly used triggers. They all are inherited from the DTrigger class. I will call them "triggers".

## Built-in DTrigger classes

### DApply

`DApply` accepts a function as an argument and calls it whenever `DApply` is triggered.

Example of a GDScript code for a Dodec declaration that prints declaration payload upon declaration trigger:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DApply.new(func (payload): print(payload))
  ])

func _bindings_initialized():
  # Will print `5`
  declaration.trigger(5)

```

### DPipe

Accepts an array of triggers and calls them one after another with the response of the previous trigger call as payload. The first trigger is called with the payload received by DPipe.

Example of a GDScript code for a Dodec declaration that adds 1 to declaration trigger's payload, multiplies it by 2, and then prints the result:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DPipe.new([
      DApply.new(func (payload): return payload + 1),
      DApply.new(func (payload): return payload * 2),
      DApply.new(func (payload): return print(payload))
    ])
  ])

func _bindings_initialized():
  # Will print `12`. Because 5+1=6, 6*2=12 and then we print it
  declaration.trigger(5)

```

### DParallel

Calls all passed triggers with its payload, returns an array of their responses.

Example of a GDScript code for a Dodec declaration that takes declaration trigger's payload, separately adds 1 to it, subtracts 1 from it, and multiplies it by 2, and then prints all the results:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DPipe.new([
      DParallel.new([
        DApply.new(func (payload): return payload + 1),
        DApply.new(func (payload): return payload - 1),
        DApply.new(func (payload): return payload * 2)
      ]),
      DApply.new(func (responses): print(responses))
    ])
  ])

func _bindings_initialized():
  # Will print `[6, 4, 10]`
  declaration.trigger(5)

```

### DCondition

Checks if every trigger in `If` returns `true` and triggers `Then` pipe. Otherwise, triggers `Else` pipe.

`Then` and `Else` parameters are optional, but at least one should be present

```gd
extends DContext

func setup_declaration():
	return DDeclaration.new([
		DCondition.new({
			"If": [DMapper.new(func (payload): return payload % 2 == 0)],
			"Then": [
				DApply.new(func (payload): print("Even"))
			],
			"Else": [
				DApply.new(func (payload): print("Odd"))
			]
		})
	])

func _bindings_initialized():
	# Will print `Even`
	declaration.trigger(4)
	# Will print `Odd`
	declaration.trigger(3)
```

### DStatic

This trigger always returns a value passed to the constructor.

Example of a GDScript code for a Dodec declaration that prints 99 upon declaration trigger:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DPipe.new([
      DStatic.new(99),
      DApply.new(func (response): print(response))
    ])
  ])

func _bindings_initialized():
  # Will print `99`
  declaration.trigger(5)

```

### DMapper

The same as `DApply` but returns a value.

Example of a GDScript code for a Dodec declaration that increments declaration payload and prints it upon trigger:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DPipe.new([
      DMapper.new(func (payload): return payload + 1),
      DApply.new(func (payload): print(payload))
    ])
  ])

func _bindings_initialized():
  # Will print `6`
  declaration.trigger(5)

```

### DEvent

This trigger has a triggered signal which is called with payload upon call. Use DSubscribe that will be called whenever `DEvent` is triggered.

Example of a GDScript code for a Dodec declaration that has a "Started" event that gets called upon declaration trigger, and a subscription to this event that prints event payload:

```gd
extends DContext

@onready var started = DEvent.new()

func setup_declaration():
  return DDeclaration.new([
    # Whenever `started` is triggered, print its payload
    DSubscribe.to(started).do([
      DApply.new(func (payload): print(payload))
    ]),
    # `DEvent` itself has `trigger` method that calls its `triggered` signal, so you can just pass it to trigger
    started
  ])

func _bindings_initialized():
  # Will print 5
  declaration.trigger(5)

```

### DState

Creates a state. Use `DState.get_value(state)` to get its value. Use `DState.set_value(state, pipe)` to update value.

Example of a declaration that increments counter upon button_pressed and prints counter value:

```gd
extends DContext

@onready var counter = DState.new(0)

@onready var button_pressed = DEvent.new()

func setup_declaration():
  return DDeclaration.new([
    DSubscribe.to(button_pressed).do([
      DState.set_value(counter, [
        DSum.new([
          DState.get_value(counter),
          1
        ])
      ]),
      DState.get_value(counter),
      DApply.new(func (value): print(value))
    ])
  ])

```

### DCommand

Accepts a class method and calls it upon trigger.

```gd
extends DContext

@onready var print_payload = DCommand.new(_print_payload)

func setup_declaration():
  return DDeclaration.new([
    print_payload
  ])

func _print_payload(payload):
  print(payload)

func _bindings_initialized():
  # Will print 5
  declaration.trigger(5)

```

### DSubscribe

Subscribes to a specific `DEvent` and calls passed triggers upon this DEvent call. `DSubscribe` instance is created through a static method `to`. `to` accepts `DEvent` instance, subscribes to its triggered signal, and executes do pipe. Method `do` accepts an array of triggers and creates a DPipe from them that will be triggered upon the specified `DEvent` call.

Example of GDScript code for a Dodec declaration with incremented event that is being called upon declaration trigger, and a subscription to this event that prints 6:

```gd
extends DContext

@onready var incremented = DEvent.new()

func setup_declaration():
  return DDeclaration.new([
    DSubscribe.to(incremented).do([
      DStatic.new(6),
      DApply.new(func (payload): print(payload))
    ]),
    incremented
  ])

func _bindings_initialized():
  # Will print 6
  declaration.trigger(5)

```

## More examples

### Example 1

The GDScript code for a Dodec declaration that calls started event with 1 as payload, multiplies it by 2, and prints the result, will look like this:

```gd
extends DContext

@onready var started = DEvent.new()

func setup_declaration():
  return DDeclaration.new([
    DSubscribe.to(started).do([
      DApply.new(func (payload): return payload * 2),
      DApply.new(func (payload): print(payload))
    ]),
    DPipe.new([
      DStatic.new(1),
      started
    ])
  ])

func _bindings_initialized():
  # Will print 2
  declaration.trigger(7)

```

Here we declare started event and create a subscription that prints the payload of started whenever it's called. DPipe triggers started event with 1 as payload.

### Example 2

The GDScript code for a Dodec declaration that subtracts 1 from the trigger payload and prints "LOL" if the resulting number is even will look like this:

```gd
extends DContext

func setup_declaration():
  return DDeclaration.new([
    DPipe.new([
      DApply.new(func (x): return x - 1),
      DApply.new(func (x):
        if x % 2 == 0:
          print("LOL")
      )
    ])
  ])

func _bindings_initialized():
  # Will print LOL
  declaration.trigger(3)

  # Won't print anything
  declaration.trigger(2)
```
