import test from 'ava'
import { MixinProvider, MixinError } from 'Src'
import { Grind } from 'grind-framework'
import { ExtendedClassAnimal, ChainSimpleBird } from 'Helpers/inheritance'
import { LandAnimalTraits } from 'Helpers/merge'

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

test('provider build errors', t => {
	t.throws(() => t.context.app.mixins.buildChain('', ChainSimpleBird), MixinError)
	t.context.app.mixins.buildChain('Bird', ChainSimpleBird)
	t.throws(() => t.context.app.mixins.buildChain('Bird', ChainSimpleBird), MixinError)

	t.throws(() => t.context.app.mixins.buildMerge('LandTraits'), MixinError)
	t.context.app.mixins.buildMerge('LandTraits', LandAnimalTraits)
	t.throws(() => t.context.app.mixins.buildMerge('LandTraits', LandAnimalTraits), MixinError)
})

test('Unknown merge method type', t => {
	class Alligator {
		static mergeMixins = {
			merge: [ { LandAnimalTraits, use: [ 'run' ] } ],
			mergeOverr: [ {  LandAnimalTraits, use: [ 'run' ] } ]
		}
	}

	t.throws(() => t.context.app.mixins.register(Alligator), MixinError)
})

test('Unregistered merge mixin', t => {
	class Alligator {
		static mergeMixins = {
			merge: [ 'NonExistantAnimalTraits' ],
			mergeOverr: {  LandAnimalTraits, use: [ 'run' ] }
		}
	}

	t.throws(() => t.context.app.mixins.register(Alligator), MixinError)
})

test('override nonexisting method', t => {
	class Alligator {
		static mergeMixins = {
			mergeOver: {  LandAnimalTraits, use: [ 'run' ] }
		}
	}

	class Alligator2 {
		static mergeMixins = {
			append: {  LandAnimalTraits, use: [ 'run' ] }
		}
	}

	t.throws(() => t.context.app.mixins.register(Alligator), MixinError)
	t.throws(() => t.context.app.mixins.register(Alligator2), MixinError)
})

test('find non existing Inheritance mixin', t => {
	t.throws(() => {
		return class extends t.context.app.mixins.mix(ExtendedClassAnimal).through('MissingClass') { }
	}, MixinError)
})
