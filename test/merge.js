import test from 'ava'
import { mix, Mixin, MixinError } from 'Src'
import {
	AnimalClass,
	LandAnimalTraits,
	WaterAnimalTraits,
	MergeSchema,
	ErrorMergeSchema
} from 'Helpers/merge'

test('basic merge methods', t => {
	const animal = new AnimalClass()
	const alligator = mix(animal)
	.mergeOver([
		{ LandAnimalTraits, use: [ 'run' ] },
		{ WaterAnimalTraits, use: [ 'swim' ] }
	])
	.merge(
		{ LandAnimalTraits, use: [ 'catchAnimal', 'walk' ] }
	)
	.merge(
		{ WaterAnimalTraits, use: [ 'transitionToLand' ] }
	)
	.prependAndDeclare([
		{ LandAnimalTraits, use: [ 'environments' ] },
		{ WaterAnimalTraits, use: [ 'environments' ] }
	])

	t.is(alligator.run('bushes'), 'Runs toward the bushes')
	t.is(alligator.swim('logs'), 'Swims toward the logs')
	t.is(alligator.catchAnimal('tuna'), 'Yummy tuna')
	t.is(alligator.transitionToLand(), 'Swims toward the shore, then walks')
	t.deepEqual(alligator.environments([ ]), [ 'rivers', 'grasslands' ])
})

test('promisified prepend methods', async t => {
	class Alligator {
		awaitMeals(meals = [ ]) {
			meals.push('cod')

			return meals
		}

	}

	const asyncAlligator = mix(new Alligator())
	.awaitPrependAndDeclare({ LandAnimalTraits, use: [ 'awaitMeals' ] })

	const alligator = mix(new Alligator())
	.prependAndDeclare({ LandAnimalTraits, use: [ 'awaitMeals' ] })

	const asyncRound1 = await asyncAlligator.awaitMeals([ ], 'tuna')
	const asyncRound2 = await asyncAlligator.awaitMeals([ ], 'tuna')

	const round1 = await alligator.awaitMeals([ ], 'tuna')
	const round2 = await alligator.awaitMeals([ ], 'tuna')

	t.is(asyncRound1[0], 'tuna')
	t.is(asyncRound2[1], 'cod')
	t.is(round1[0], 'cod')
	t.is(round2[1], 'tuna')
})

test('promisified append methods', async t => {
	class Alligator {
		awaitMeals(meals = [ ]) {
			meals.push('cod')

			return meals
		}

	}

	const asyncAlligator = mix(new Alligator())
	.awaitAppendAndDeclare({ LandAnimalTraits, use: [ 'awaitMeals' ] })

	const alligator = mix(new Alligator())
	.appendAndDeclare({ LandAnimalTraits, use: [ 'awaitMeals' ] })

	const asyncRoundMeals = await asyncAlligator.awaitMeals([ ], 'tuna')
	asyncRoundMeals.push('steak')

	const normalRoundMeals = alligator.awaitMeals([ ], 'tuna')
	normalRoundMeals.push('steak')

	t.is(asyncRoundMeals[0], 'cod')
	t.is(asyncRoundMeals[1], 'tuna')
	t.is(asyncRoundMeals[2], 'steak')

	t.is(normalRoundMeals[0], 'cod')
	t.is(normalRoundMeals[1], 'steak')
	t.is(normalRoundMeals[2], undefined)
})

test('promisified prepend and append together', async t => {
	class Alligator {
		awaitMeals(meals = [ ]) {
			meals.push('cod')

			return meals
		}

	}
	const alligator = new Alligator()

	mix(alligator)
	.awaitAppend({ LandAnimalTraits, use: [ 'awaitMeals' ] })
	.awaitPrepend({ LandAnimalTraits, use: [ 'awaitMeals' ] })

	const meals = await alligator.awaitMeals([ ], 'tuna')

	t.is(meals[0], 'tuna')
	t.is(meals[1], 'cod')
	t.is(meals[2], 'tuna')
})

test('Using non-existing merge object traits', t => {
	const animal = new AnimalClass()

	t.throws(() => {
		mix(animal)
		.mergeOverAndDeclare([
			{ LandAnimalTraits, use: [ 'run, sprint' ] },
			{ WaterAnimalTraits, use: [ 'swim' ] }
		])
	}, MixinError)
})

test('Merge using un-nested merge object', t => {
	class Alligator {
		walk() { return 'Walks' }
		swim() { return 'Swims' }
	}
	const alligator = mix(new Alligator).mergeAndDeclare({ WaterAnimalTraits, use: [ 'transitionToLand' ] })

	t.is(alligator.transitionToLand(), 'Swims, then Walks')
})

test('Merge using overrideDepends', t => {
	class Alligator {
		hasTeeth() { return 'true' }
	}

	const alligator = mix(new Alligator)
	.mergeAndDeclare({
		WaterAnimalTraits,
		use: [ 'catchFish' ],
		overrideDepends: 'catchFish:[hasTeeth]'
	})

	t.is(alligator.catchFish('tuna'), 'Yummy tuna')
})

test('merge using invalid overrideDepends', t => {
	class Alligator {
		hasTeeth() { return 'true' }
	}

	t.throws(() => {
		mix(new Alligator)
		.mergeAndDeclare({
			WaterAnimalTraits,
			use: [ 'catchFish' ],
			overrideDepends: 'nonExistantFunction:[hasTeeth]'
		})
	}, MixinError)
})

test('prototype method', t => {
	class AlligatorClass extends AnimalClass { }

	mix(AlligatorClass)
	.onPrototype(builder => {
		builder.mergeOver([
			{ LandAnimalTraits, use: [ 'run' ] },
			{ WaterAnimalTraits, use: [ 'swim' ] }
		])
		builder.merge(
			{ LandAnimalTraits, use: [ 'catchAnimal', 'walk' ] }
		)
		builder.merge(
			{ WaterAnimalTraits, use: [ 'transitionToLand' ] }
		)
		builder.prepend([
			{ LandAnimalTraits, use: [ 'environments' ] },
			{ WaterAnimalTraits, use: [ 'environments' ] }
		])
	})
	.merge({ LandAnimalTraits, use: [ 'hunt' ] })

	const alligator = new AlligatorClass()

	t.is(alligator.run('bushes'), 'Runs toward the bushes')
	t.is(alligator.swim('logs'), 'Swims toward the logs')
	t.is(alligator.catchAnimal('tuna'), 'Yummy tuna')
	t.is(alligator.transitionToLand(), 'Swims toward the shore, then walks')
	t.deepEqual(alligator.environments([ ]), [ 'rivers', 'grasslands' ])
	t.is(AlligatorClass.hunt(), 'Looks in the bushes')
})

test('merge schema on prototype with usesSchema()', t => {
	const alligator = new AnimalClass()
	const alligator2 = new AnimalClass()
	mix(alligator).useSchema(MergeSchema)

	t.is(alligator.run(), 'Can`t run')
	t.is(alligator.runs(null, 'bushes'), 'Runs toward the bushes')
	t.is(alligator.transitionToLand(), 'Can`t swim, then walks. Then: Runs toward the horizon')

	const error = t.throws(() => alligator2.runs(null, 'bushes'), TypeError)
	t.is(error.message, 'alligator2.runs is not a function')
})

test('error merge schema', t => {
	const alligator = new AnimalClass()

	const error = t.throws(() => Mixin.structure(alligator, ErrorMergeSchema), MixinError)
	t.is(error.message, 'Mixin transition: Missing dependents for \'transitionToLand\': [ transitionToLand ].')
})

test('register class MergeSchema outside of provider', t => {
	class Alligator {
		static mergeMixins = { onPrototype: MergeSchema }

		swim() { return 'Can`t swim' }
	}

	mix(Alligator).register()
	const alligator = new Alligator()

	t.is(alligator.runs(null, 'bushes'), 'Runs toward the bushes')
	t.is(alligator.transitionToLand(), 'Can`t swim, then walks. Then: Runs toward the horizon')
})

test('depending upon an alias', t => {
	class Alligator { }
	const alligator = new Alligator

	mix(alligator)
	.merge([
		{ LandAnimalTraits, use: [ 'walk as run' ] },
		{ LandAnimalTraits, use: [ 'hunt' ], overrideDepends: 'hunt:[run]' }
	])

	t.is(alligator.hunt(), 'Looks in the bushes')

	class AlligatorSchema {
		static mergeMixins = {
			onPrototype: {
				merge: [
					{ LandAnimalTraits, use: [ 'walk as run' ] },
					{ LandAnimalTraits, use: [ 'hunt' ], overrideDepends: 'hunt:[run]' }
				]
			}
		}
	}

	mix(AlligatorSchema).register()
	const alligatorSchema = new AlligatorSchema()

	t.is(alligatorSchema.hunt(), 'Looks in the bushes')
})
