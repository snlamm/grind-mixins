import test from 'ava'
import { mix } from 'Src'
import { ExtendedClassAnimal, ChainSimpleBird, ChainComplexPredator  } from 'Helpers/inheritance'


test('test base and extended test classes', t => {
	const Heron = class Heron extends ExtendedClassAnimal {
		constructor() {
			super()

			this.animalName = 'heron'
		}

		heronSound() {
			return 'Cawww'
		}
	}

	const heron = new Heron()

	t.is(heron.animalName, 'heron')
	t.is(heron.heronSound(), 'Cawww')
	t.is(heron.findAnimalType(), 'animal')
})

test('chain simple inheritance mixins', t => {
	const Heron = class Heron extends mix(ExtendedClassAnimal).through(ChainSimpleBird) {
		constructor() {
			super()

			this.animalName = 'heron'
		}

		heronSound() {
			return 'Cawww'
		}
	}

	const heron = new Heron()

	t.is(heron.animalName, 'heron')
	t.is(heron.findAnimalType(), 'bird')
	t.is(heron.hunt(), 'Does not hunt')
})

test('chain complex inheritance mixins', t => {
	const Heron = class Heron extends mix(ExtendedClassAnimal).through(ChainSimpleBird, ChainComplexPredator) {
		constructor() {
			super()

			this.animalName = 'heron'
		}

		sound() {
			let sound = null

			if(super.sound) {
				sound = super.sound()
			}

			return `Cawww ${sound}`
		}
	}

	const heron = new Heron()

	t.is(heron.animalName, 'heron')
	t.is(heron.sound(), 'Cawww Screetch')
	t.is(heron.findAnimalType(), 'bird')
	t.is(heron.hunt('fish'), 'The heron hunts fish using beak and talons')
})
