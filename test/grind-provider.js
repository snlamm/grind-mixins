import test from 'ava'
import { MixinProvider } from 'Src'
import { Grind } from 'grind-framework'
import { ExtendedClassAnimal, ChainSimpleBird, ChainComplexPredator  } from 'Helpers/inheritance'
import {
	AnimalClass,
	LandAnimalTraits,
	WaterAnimalTraits,
	// MergeSchema,
	// ErrorMergeSchema
} from 'Helpers/merge'

test.beforeEach(t => {
	const app = new Grind({ configClass: class {
		get(getting, defaults) { return defaults }
	} })

	MixinProvider(app)
	t.context.app = app
})

test('Build Inheritance Chain', t => {
	t.context.app.mixins.buildChain('Bird', ChainSimpleBird)
	t.context.app.mixins.buildChain('Predator', ChainComplexPredator)

	const Heron = class Heron extends t.context.app.mixins.mix(ExtendedClassAnimal)
	.through('Bird', 'Predator') { }

	const heron = new Heron()

	t.is(heron.findAnimalType(), 'bird')
	t.is(heron.sound(), 'Screetch')
})

test('Build Merge', t => {
	t.context.app.mixins.buildMerge('LandAnimal', LandAnimalTraits)
	t.context.app.mixins.buildMerge('WaterAnimal', WaterAnimalTraits)

	const alligator = t.context.app.mixins.mix(new AnimalClass())
	.mergeOver([ 'WaterAnimal(swim)', 'LandAnimal(run)' ])
	.mergeAndDeclare([
		{ HuntWalkAsSlow: 'LandAnimal(hunt, walk as walkSlow)' },
		{ WaterTransition: 'WaterAnimal(transitionToLand)', overrideDepends: 'transitionToLand:[swim,walkSlow]' }
	])

	t.is(alligator.swim('logs'), 'Swims toward the logs')
	t.is(alligator.run('bushes'), 'Runs toward the bushes')
	t.is(alligator.walkSlow(), 'walks')
	t.is(alligator.transitionToLand('swim', 'walkSlow'), 'Swims toward the shore, then walks')
	t.throws(() => alligator.walk(), TypeError)
})
