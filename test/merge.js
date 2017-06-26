import test from 'ava'
import 'Helpers/merge/AnimalClass'
import 'Helpers/merge/LandAnimalTraits'
import 'Helpers/merge/WaterAnimalTraits'
import 'Helpers/merge/MergeSchema'
import { mix, Mixin } from 'Src'

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
