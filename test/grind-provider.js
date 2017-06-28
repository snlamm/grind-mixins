import test from 'ava'
import { MixinProvider, MixinError } from 'Src'
import { Grind } from 'grind-framework'
import { ExtendedClassAnimal, ChainSimpleBird, ChainComplexPredator  } from 'Helpers/inheritance'
import {
	AnimalClass,
	LandAnimalTraits,
	WaterAnimalTraits,
	MergeSchema,
	ErrorMergeSchema
} from 'Helpers/merge'

test.beforeEach(t => {
	const app = new Grind({ configClass: class {
		get(getting, defaults) { return defaults }
	} })

	MixinProvider(app)
	t.context.app = app
})

test.afterEach(t => {
	t.context.app.mixins.mixins = { }
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
		'LandAnimal(hunt, walk as walkSlow)',
		{ string: 'WaterAnimal(transitionToLand)', overrideDepends: 'transitionToLand:[swim,walkSlow]' }
	])

	t.is(alligator.swim('logs'), 'Swims toward the logs')
	t.is(alligator.run('bushes'), 'Runs toward the bushes')
	t.is(alligator.walkSlow(), 'walks')
	t.is(alligator.transitionToLand('swim', 'walkSlow'), 'Swims toward the shore, then walks')
	t.throws(() => alligator.walk(), TypeError)
})

test('register', t => {
	t.context.app.mixins.buildMerge('LandAnimal', LandAnimalTraits)
	t.context.app.mixins.buildMerge('WaterAnimal', WaterAnimalTraits)

	class AlligatorClass extends AnimalClass {
		static mergeMixins = {
			onPrototype: {
				mergeOver: [
					'LandAnimal(run)',
					'WaterAnimal(swim)',
				],
				merge: [ 'LandAnimal(hunt, walk as walkSlow)' ]
			},
			onPrototype2: {
				merge: [
					{ string: 'WaterAnimal(transitionToLand)',
					overrideDepends: 'transitionToLand:[swim,walkSlow]' }
				]
			},
			merge: [ 'LandAnimal(hunt)' ]
		}
	}

	t.context.app.mixins.register(AlligatorClass)
	const alligator = new AlligatorClass()

	t.is(alligator.run('bushes'), 'Runs toward the bushes')
	t.is(alligator.walkSlow(), 'walks')
	t.is(alligator.transitionToLand('swim', 'walkSlow'), 'Swims toward the shore, then walks')
	t.throws(() => alligator.walk(), TypeError)
	t.is(AlligatorClass.hunt(), 'Looks in the bushes')
})

test('register prebuild schema', t => {
	t.context.app.mixins.buildMerge('LandAnimal', LandAnimalTraits)
	t.context.app.mixins.buildMerge('WaterAnimal', WaterAnimalTraits)

	class AlligatorClass extends AnimalClass {
		static mergeMixins = { onPrototype: MergeSchema }
	}

	t.context.app.mixins.register(AlligatorClass)
	const alligator = new AlligatorClass()

	t.is(alligator.run(), 'Can`t run')
	t.is(alligator.runs(null, 'bushes'), 'Runs toward the bushes')
	t.is(alligator.transitionToLand(), 'Can`t swim, then walks. Then: Runs toward the horizon')
})

test('register prebuild schema error', t => {
	t.context.app.mixins.buildMerge('LandAnimal', LandAnimalTraits)
	t.context.app.mixins.buildMerge('WaterAnimal', WaterAnimalTraits)

	class AlligatorClass extends AnimalClass {
		static mergeMixins = { onPrototype: ErrorMergeSchema }
	}

	const error = t.throws(() => t.context.app.mixins.register(AlligatorClass), MixinError)
	// eslint-disable-next-line max-len
	t.is(error.message, 'Mixin transition: Missing dependents for \'transitionToLand\': [ transitionToLand ]. Note: if using prototype, dependents must represent functions')
})
