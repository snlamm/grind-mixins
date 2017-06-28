import test from 'ava'
import { mix, Mixin, MixinError } from 'Src'
import {
	AnimalClass,
	LandAnimalTraits,
	WaterAnimalTraits,
	MergeSchema,
	ErrorMergeSchema
} from 'Helpers/merge'

test('merge methods', t => {
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
		builder.prependAndDeclare([
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

test('merge schema', t => {
	const alligator = new AnimalClass()
	mix(alligator).structure(MergeSchema)

	t.is(alligator.run(), 'Can`t run')
	t.is(alligator.runs(null, 'bushes'), 'Runs toward the bushes')
	t.is(alligator.transitionToLand(), 'Can`t swim, then walks. Then: Runs toward the horizon')
})

test('error merge schema', t => {
	const alligator = new AnimalClass()

	const error = t.throws(() => Mixin.structure(alligator, ErrorMergeSchema), MixinError)
	t.is(error.message, 'Mixin transition:  Missing dependents for \'transitionToLand\': [ transitionToLand ]. ')
})
