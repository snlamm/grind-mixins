# plugin-grind-mixins

<a href="https://travis-ci.org/snlamm/grind-mixins"><img src="https://travis-ci.org/snlamm/grind-mixins.svg?branch=master" alt="Build Status"></a>
<a href="https://www.npmjs.com/package/plugin-grind-mixins"><img src="https://img.shields.io/gemnasium/mathiasbynens/he.svg" alt="Dependencies"></a>
<a href="https://www.npmjs.com/package/plugin-grind-mixins"><img src="https://img.shields.io/npm/v/plugin-grind-mixins.svg" alt="NPM Version"></a>
<a href="https://www.npmjs.com/package/plugin-grind-mixins"><img src="https://img.shields.io/npm/l/plugin-grind-mixins.svg" alt="License"></a>

Plugin Grind Mixins is a tool for building ES6 class mixins that are fast, flexible, and free of dependency confusion. It is inspired by [Grind Framework](https://grind.rocks/) and has a handy interface for Grind projects. Note that features can be used as well in non-Grind projects.

Plugin Grind Mixins, internally, is built using mixin patterns suggested by [Raganwald](http://raganwald.com/2015/12/31/this-is-not-an-essay-about-traits-in-javascript.html) and [justinfagnani](http://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/), however it provides a much different interface.

<!-- TOC depthFrom:2 depthTo:4 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Installation](#installation)
- [Types of Mixins](#types-of-mixins)
- [Inheritance Mixins](#inheritance-mixins)
	- [Building Inheritance Mixins](#building-inheritance-mixins)
	- [Applying Inheritance Mixins](#applying-inheritance-mixins)
	- [Example Inheritance Mixin](#example-inheritance-mixin)
- [Merge Mixins](#merge-mixins)
	- [Merge Types](#merge-types)
	- [Building Merge Mixins](#building-merge-mixins)
	- [Structuring Merge Objects](#structuring-merge-objects)
		- [Adding Dependencies to Merge Objects](#adding-dependencies-to-merge-objects)
	- [Using MergeSchemas](#using-mergeschemas)
	- [MergeSchema via a JSON Schema](#mergeschema-via-a-json-schema)
		- [Example Basic JSON Schema](#example-basic-json-schema)
		- [Advanced JSON Schema](#advanced-json-schema)
		- [Applying JSON Schemas Directly On Class Instances](#applying-json-schemas-directly-on-class-instances)
	- [MergeSchema via Merge API](#mergeschema-via-merge-api)
		- [Advanced Merge API](#advanced-merge-api)
- [Grind Sugar](#grind-sugar)
	- [Mix Syntax](#mix-syntax)
	- [Caching Mixins](#caching-mixins)
	- [Advanced Cached Mixin Object](#advanced-cached-mixin-object)
	- [Pre-Registering JSON Schemas](#pre-registering-json-schemas)
- [Contributing](#contributing)

<!-- /TOC -->

## Installation
First, add the `plugin-grind-mixins` package via your preferred package manager:

```shell
npm install --save plugin-grind-mixins
```

## Types of Mixins
plugin-grind-mixins grants access to two types of mixins: Inheritance and Merge. They can be used together, though they work quite differently.

## Inheritance Mixins
Inheritance mixins are added to the inheritance chain of a class. Because they use inheritance, these mixins can use `super()` (unlike Merge mixins or attributes added through `Object.assign()` and the like).

### Building Inheritance Mixins
Build the mixin by pointing a function at the class you want to mix in:
```js
parentClass => class OptionalClassName extends parentClass {
	// class logic
}
```

### Applying Inheritance Mixins
Apply Inhertance mixins at class declaration with:

```js
mix(BaseClass).through(Mixin1, Mixin2, ...)
```


### Example Inheritance Mixin
In this example, Bird and Predator classes are mixed into the Heron class so that the inheritance chain becomes `Heron > Predator > Bird > Animal`:
```js
//AnimalMixins.js

export const Predator = parentClass => class extends parentClass {
	constructor() {
		super()
		this.isPredator = true
	}

	hunt(prey) {
		return `The ${this.animalName} hunts ${prey} using ${this.uses()}`
	}
}

export const Bird = parentClass => class extends parentClass {
	uses() {
		return 'talons'
	}
}
```
```js
//Heron.js

import { mix } from 'plugin-grind-mixins'
import { Bird, Predator } from 'AnimalMixins'
import { BaseAnimal } from 'Somewhere'

class Heron extends mix(BaseAnimal).through(Bird, Predator) {
	constructor() {
		super()
		this.animalName = 'heron'
	}

}

const heron = new Heron()

heron.isPredator
// true
heron.hunt(fish)
// The heron hunts fish using talons
```
Mixins are applied in order of entry, so Bird is a base class for Predator. Thus, Predator can use `super()` to access functions in Bird, though not vice-versa.

## Merge Mixins
Merge mixins add properties directly onto a declared class or class prototype. Note that they do not work through inheritance and, therefore, cannot use `super()`.

Example that shows a number of Merge mixins (through a [JSON MergeSchema](#mergeschema-via-a-json-schema)):
```js
// AnimalMixins.js

export const WaterTraits = {
	swim(location) { return `Swims toward the ${location}` },
	huntFish() { return 'Hunting Fish' },
	eatFish(number) { /* code to asynchronously update model with the number of total fish eaten */ },
	environments(types) { types.push('rivers') },
	breathThroughGills() { return 'Breathing through gills' }
}

export const LandTraits = {
	run(location) { return `Runs toward the ${location}` },
	environments(types) { types.push('shores') }
}
```

```js
// Alligator.js

import { mix } from 'plugin-grind-mixins'
import { WaterTraits, LandTraits } from 'AnimalMixins'

class Alligator {
	static mergeMixins() {
		return {
			onPrototype: {
				merge: [
					{ WaterTraits, use: [ 'swim', 'huntFish' ] },
					{ LandTraits, use: [ 'run' ] }
				],
				append: [
					{ WaterTraits, use: [ 'environment' ] },
					{ LandTraits, use: [ 'environment' ] },
				],
				awaitPrepend: [ { WaterTraits, use: [ 'eatFish' ]} ]
			}
		}
	}

	environments(types = [ ]) { return types }
	eatFish(number) { return `Eats ${number} fish`}
}

mix(Alligator).register()
const alligator = new Alligator()

alligator.swim('shore')
// Swims toward the shore
alligator.run('horizon')
// Runs toward the horizon
alligator.environments([ ])
 // [ 'rivers', 'shores' ]
await alligator.eatFish(3)
// (Alligator model total number of fish eaten is increased by 3)
// Eats 3 fish
alligator.breathThroughGills()
// TypeError: alligator.breathThroughGills is not a function
```

### Merge Types
There are four types of merges: `merge`, `mergeOver`, `prepend`, and `append`

##### merge
adds _new_ functions to the target. Errors if any of the functions _already_ exist on the target.

##### mergeOver
_overrides_ functions that already exist on the target. Automatically passes in the original function as the first argument. Errors if any of the functions _do not yet_ exist on the target.

##### prepend
 _adds_ 'before hooks' to functions that already exist on the target. All arguments passed into the function are passed into the before hooks. Errors if any of the functions do not yet exist on the target. Before hooks run synchronously.

##### append
_adds_ 'after hooks' to functions that already exist on the target. All arguments passed into the function are passed into the after hooks. Errors if any of the functions do not yet exist on the target. After hooks run synchronously.

For prepend and append, if the hooks should run _asynchronously_, use the special merges `awaitPrepend` and `awaitAppend`. Note, the methods these hooks are applied to will now each return a promise.

### Building Merge Mixins
Merge mixins are constructed using `MergeSchemas`, which detail how to apply functions found in `Merge Objects` to the target class/prototype.

### Structuring Merge Objects

Merge Objects are simply objects with keys pointing to functions.

Example:
```js
// AnimalTypeMixins.js

export const WaterTraits = {
	// this function, intending to be mixed with mergeOver(), passes in the overridden method as its first argument
	swim(overridenMethod, location) { return `Swims toward the ${location}` },

	environments(types) { types.push('rivers') }
}

export const LandTraits = {
	// this function, intending to be mixed with mergeOver(), passes in the overridden method as its first argument
	run(overridenMethod, location) { return `Runs toward the ${location}` },

	walks() { 'walks' }

	environments(types) { types.push('grasslands') }
}

```

#### Adding Dependencies to Merge Objects

Merge Objects can specify class/instance methods or variables that their functions depend upon. An Error will throw when the mixin is applied to a class missing the dependency.

To add dependencies to a function, have its key point to an object with the function behind an `action` key and the array of dependencies behind a `depends` key.

Example
```js
export const WaterTraits = {
	swim: {
		action(location) {
			return `Swims toward the ${location} at speed: ${this.speed}`
		},
		depends: [ 'speed' ]
	}
}
```

Note: When applying dependents to a class _instance_, it will only work with instance _functions_, not variables.

### Using MergeSchemas
There are two ways to use a MergeSchema to apply a Merge Object to a class:
 1. Register a JSON schema - best for applying mixins across an entire class.
 2. Use API methods - best for a single class instance.

### MergeSchema via a JSON Schema

JSON schemas apply Merge Objects in accordance with a JSON MergeSchema.

JSON schemas are registered using:

 `mix(class).register(SchemaName)`:
```js
import { mix } from 'plugin-grind-mixins'

mix(classObject).register(SchemaName)
```

###### Parameters
* `classObject` - the class to register a JSON Schema for.
* `SchemaName` - the name of the static variable or function that will return the JSON schema. Defaults to 'mergeMixins'.


#### Example Basic JSON Schema

```js
import { Animal } from 'Somewhere'
import { LandTraits, WaterTraits} from 'Somewhere'

class Alligator extends Animal {
	static MergeSchema = {
		merge: [
			{ LandTraits, use: [ 'run', 'walk' ] },
			{ WaterTraits, use: [ 'transitionToLand' ] }
		],
		mergeOver: [
			{ LandTraits, use: [ 'hasTail' ] }
		],
		prepend: [
			{ LandTraits, use: [ 'environment' ] },
			{ WaterTraits, use: [ 'environment' ]}
		]
	}

}
```

#### Advanced JSON Schema
Additional features add control over dependencies and minimize method conflicts.

---
##### Use
In the JSON schemas, you can pick and choose which functions to use from a Merge Object using the `use` field. Even if using all the functions in a Merge Object, best practice is to always explicitly name each function in the `use` field for the sake of clarity.
```js
static MergeSchema = {
	merge: [
		{ LandTraits, use: [ 'run', 'walk' ] }
	]
}
```

---
##### Alias
You can use a Merge Object function but alias it to a different name.

In the `use` field, put `'name as alias'`.

```js
static MergeSchema = {
	merge: [
		{ LandTraits, use: [ 'run as runFast', 'walk' ] }
	]
}

alligator.runFast() /* will work */
alligator.run() /* will fail unless run() is defined elsewhere */
```
---
##### Override Depends
You may want to temporarily change Merge Object dependencies as they are applied. For example, perhaps you want the dependency to point to an aliased merge function.
To add/remove/rename Merge Object dependencies, use the key `overrideDepends`.

It should be structured as such:
```js
{ overrideDepends: 'functionName:[newDependency1,newDependency2],functionName2[newDependency1,newDependency2]' }
```


Example:
```js
static MergeSchema = {
	merge: [
		{ WaterTraits, use: [ 'swimType as stroke', 'breathingType'] }
		{ WaterTraits,
			use: [ 'swim' ],
			overrideDepends: 'swim:[breathingType,stroke]'
		}
	]
}

alligator.swim('shore') /* this will work */
```

---
##### onPrototype
Instead of applying Merge Objects only to class constructors, you can apply them to prototypes. Each initialized class prototype would then have the merge attributes. To target a class's prototype, nest the relevant part of the JSON schema inside of `onPrototype: { }`

Example:
```js
class Alligator {
	static mergeMixins = {
		onPrototype: {
			merge: [
				{ WaterTraits, use: [ 'swim' ] },
				{ LandTraits, use: [ 'run' ] }
			]
		},
		merge: [ { WaterTraits: use: [ 'huntFish' ] }]
	}

}

mix(Alligator).register()
Alligator.huntFish()
// Eating Fish

const alligator = new Alligator()
alligator.swim('shore')
// Swims toward the shore
alligator.run('horizon')
// Runs toward the horizon
```

---
##### Repeating a Merge Method
On rare occasionan, you may want to apply a merge method more than once, perhaps because there is a sensitive order in which Merge Object functions must be applied.

To do this, number the merge methods by adding an incrementing number to the end of their names.

Example:
```js
const mergeSchema = {
	merge: [
		{ LandTraits, use: [ 'hasFeet' ] }
	],
	mergeOver: [
		{ LandTraits, use: [ 'run', 'walk' ] },
	],
	merge2: [
		{ WaterTraits, use: [ 'transitionToLand' ] }
	]
}
```

Imagine that the overrides run/walk depend on new method hasFeet() existing. New method transitionToLand, in turn, depends on run/walk existing.

#### Applying JSON Schemas Directly On Class Instances

In examples so far, schemas have been built directly in class declarations so they apply to the constructor and all prototypes. Let's say, however, you want to apply a schema on a single class instance without applying it to the entire prototype (i.e. all instances).

To do that, use `useSchema()`
```js
const mergeSchema = {
	merge: [ { LandTraits, use: [ 'hasFeet' ] } ],
	mergeOver: [ { LandTraits, use: [ 'run', 'walk' ] } ]
}

mix(instance).useSchema(mergeSchema)
```

###### Parameters
* `instance` - the class instance to register a JSON Schema for.
* `mergeSchema` - the JSON schema object to apply to the instance.

Example:
```js
import { mix } from 'plugin-grind-mixins'
import { LandTraits } from 'Somewhere'

const MergeSchema = {
	merge: [ { LandTraits, use: [ 'run' ] }
}

const alligator = new Alligator()
const alligator2 = new Alligator()

mix(alligator).useSchema(MergeSchema)

alligator.run('horizon')
// Runs toward the horizon
alligator2.run('horizon')
// TypeError: alligator2.run is not a function
```
---

### MergeSchema via Merge API

The Merge API is an alternate way to construct a MergeSchema using methods.

The API methods correspond to the four main merge methods (plus `awaitAppend` and `awaitPrepend`) and the arguments passed to the methods look much like their JSON schema counterparts.

Example Usage of the Merge API:

```js
import { mix } from 'plugin-grind-mixins'
import { LandTraits, WaterTraits } from 'Somewhere'

class Alligator { }

const alligator = new Alligator()
mix(alligator)
.mergeOver([
	{ LandTraits, use: [ 'run' ] },
	{ WaterTraits, use: [ 'swim' ] }
])
.merge({ LandTraits, use: [ 'catchAnimal', 'walk' ] })
.mergeOver({ WaterTraits, use: [ 'transitionToLand' ] })
.prepend([
	{ LandTraits, use: [ 'environments' ] },
	{ WaterTraits, use: [ 'environments' ] }
])

alligator.run('horizon') /* this will work */
```

Note: all API methods are chainable.

#### Advanced Merge API
---
##### Use
You should add `use` clauses to specify which Merge Object functions to use. Apply this the same way as in the JSON schema (link).

---
##### Override Depends
Sometimes you want to add/remove/rename the dependencies for a function in the Mixin Object. You can do that with `overrideDepends`. Apply this the same way as in the JSON schema (link).

---
##### onPrototype
The API is meant to be used directly on class instances. However, if you want to use the API on a class constructor in order to effect all prototypes use `onPrototype()`.

Example:
```js
import { mix } from 'plugin-grind-mixins'

class AlligatorClass extends AnimalClass { }

mix(AlligatorClass)
.onPrototype(builder => {
	builder.mergeOver([
		{ LandAnimalTraits, use: [ 'run' ] },
		{ WaterAnimalTraits, use: [ 'swim' ] }
	])
})

const alligator = new AlligatorClass()
alligator.run('horizon')
// 'Runs toward the shore'
alligator.swim('shore')
// 'Swims toward the shore'
```

Note that, for effecting a class constructor/all prototypes, using a JSON schema is usually easier and cleaner.

---
##### Return the Class Instance
By default, every Mixin API method returns a Mixin object. If you want to, instead, return the altered class instance, add `*AndDeclare()` to the final API method.

Example:
```js
import { mix } from 'plugin-grind-mixins'

class Alligator { }

const alligator = mix(new Alligator())
.merge({ LandAnimalTraits, use: [ 'run' ] })
.mergeOverAndDeclare({ LandAnimalTraits, use: [ 'run' ] })

const alligator2 = mix(new Alligator())
.merge({ LandAnimalTraits, use: [ 'run' ] })
.mergeOver({ LandAnimalTraits, use: [ 'run' ] })

alligator.constructor.name /* instance of Alligator */
// Alligator
alligator2.constructor.name /* instance of Mixin */
// Mixin
```
---

## Grind Sugar
Plugin Grind Mixins can be used with or without Grind. Using the Grind ecosystem, however, we can add useful syntactic sugar and reduce the number of imports necessary to use mixins.

First, you'll need to add `MixinProvider` to your `app/Bootstrap.js`.

```js
// app/Bootstrap.js

import Grind from 'grind-framework'
import { MixinProvider } from 'plugin-grind-mixins'

const app = new Grind()
app.providers.push(MixinProvider)
```

### Mix Syntax
Adding mixins _inside of a class/function_ can now use the `app.mixins.mix(classOrInstance)` function:

```js
const alligator = new Alligator()

app.mixins.mix(alligator).merge({ LandAnimal, use: [ 'run' ] })
```


Note that `app.mixins` will not work on a top level class declaration, as the provider will not yet have been run and the `app` object isn't available.

Example that will fail:
```js
// AlligatorModel.js

import { BaseAnimalModel, PredatorModel } from 'Somewhere'

class AlligatorModel extends this.app.mixins.mix(BaseAnimalModel)
.through(PredatorModel) {
	//
}

// This will fail. this.app is not defined.
```

### Caching Mixins

You can cache Inheritance classes and Merge Objects so that they no longer need to be imported when you use them.

Cahcing should happen in `app/Providers/MixinBuilderProvder.js`, which you'll need to add to `app/Bootstrap.js`


```js
// app/Bootstrap.js

import Grind from 'grind-framework'
import { MixinProvider } from 'plugin-grind-mixins'
import { MixinBuilderProvder } from './Providers/MixinBuilderProvder'

const app = new Grind()
app.providers.push(MixinProvider)
app.providers.push(MixinBuilderProvder)
```

```js
// app/Providers/MixinBuilderProvider.js

import { LandTraits, WaterTraits } from 'Somewhere With Merge Objects'
import { Bird, Predator } from 'Somewhere with Mixin Classes'

export function MixinBuilderProvider(app) {
	app.mixins.buildMerge('LandTraits', LandTraits)
	app.mixins.buildMerge('WaterTraits', WaterTraits)

	app.mixins.buildChain('Bird', Bird)
	app.mixins.buildChain('Predator', Predator)
}
```

To cache Merge Objects, use `buildMerge(name, MergeObject)`. For Inhertiance classes, use `buildChain(name, InheritanceMixin)`.

###### Parameters
* `name` - the name of the cached mixin, which is how it will be referenced.
* `MergeObject` - the Merge Object to cache.
* `InheritanceMixin` - the Inheritance mixin to cache.


Now when using the Mixin Object or Inheritance class, you can reference it using its string name.

For a Merge Object:
```js
const alligator = new Alligator()

this.app.mixins.mix(alligator)
.mergeOver([ 'WaterAnimal(swim)', 'LandAnimal(run, walk)' ])
```

Or for an Inheritance Mixin (assuming it's inside of an already declared class):
```js
const Heron = class Heron extends this.app.mixins.mix(BaseAnimal).through('Bird', 'Predator') { }
```

### Advanced Cached Mixin Object

You can still use [`use`](#use), [`alias`](#alias), and [`overrideDepends`](#override-depends) in MergeSchemas that use cached Mixin Objects.

Example:
```js
class AlligatorClass {
	static mergeMixins = {
		onPrototype: {
			mergeOver: [
				'LandAnimal(run)',
				'WaterAnimal(swim)',
			],
			merge: [
				'LandAnimal(hunt, walk as walkSlow)',
				{
					string: 'WaterAnimal(transitionToLand)',
					overrideDepends: 'transitionToLand:[swim,walkSlow]'
				}
			}
		]
	}

}
```

### Pre-Registering JSON Schemas
Classes can be [registered](#mergeschema-via-a-json-schema) in the `MixinBuilderProvider` so that as soon as the provider is run, the class's JSON Schema will be applied and can be used right away without further registering.

To register a class, use:
```js
app.mixins.register(classObject, SchemaName)
```


###### Parameters
* `classObject` - the class to register a MergeSchema for.
* `SchemaName` - the name of the static variable for class function that returns the JSON schema. Defaults to 'mergeMixins'

Example:
```js
// app/Providers/MixinBuilderProvider.js

import { LandTraits, WaterTraits } from 'Somewhere'
import { Alligator } from 'Somewhere'

export function MixinBuilderProvider(app) {
	app.mixins.register(Alligator)
}
```

```js
// Alligator.js

class Alligator {
	static mergeMixins = {
		onPrototype: {
			merge: [
				{ WaterTraits, use: [ 'swim', 'huntFish' ] },
				{ LandTraits, use: [ 'run' ] }
			]
		}
	}

	hunt(location) {
		return `${this.swim(location)} and looks for fish.`
	}

}

// No need to register Alligator here. Go ahead and use the mixin capabilities!
const alligator = new Alligator()
alligator.hunt('shore')
// Swims toward the shore and looks for fish.
alligator.run('horizon')
// Runs toward the horizon
```
---

## Contributing
Contributions are always welcome! You are encouraged to open issues and merge requests.

The dev environment and scripts are largely borrowed from Grind Framework, while the README borrows some language from the Grind Docs.

To run the tests, use `npm run test`.
