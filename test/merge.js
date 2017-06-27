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

test('merge schema', t => {
	const alligator = new AnimalClass()

	Mixin.structure(alligator, MergeSchema)

	t.is(alligator.run(), 'Can`t run')
	t.is(alligator.runs(null, 'bushes'), 'Runs toward the bushes')
	t.is(alligator.transitionToLand(), 'Can`t swim, then walks. Then: Runs toward the horizon')
})

test('error merge schema', t => {
	const alligator = new AnimalClass()

	const error = t.throws(() => Mixin.structure(alligator, ErrorMergeSchema), MixinError)
	t.is(error.message, 'Mixin transition:  Missing dependents for \'transitionToLand\': [ transitionToLand ]. ')
})
