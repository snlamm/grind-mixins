import test from 'ava'
import 'Helpers/merge/AnimalClass'
import 'Helpers/merge/LandAnimalTraits'
import 'Helpers/merge/WaterAnimalTraits'
import { mix } from 'Src'

test('alligator', t => {
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
