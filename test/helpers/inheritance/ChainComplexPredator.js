export const ChainComplexPredator = parentClass => class extends parentClass {
	isPredator = null

	constructor() {
		super()

		this.isPredator = true
	}

	hunt(prey) {
		return `The ${this.animalName} hunts ${prey} using ${this.uses()}`
	}

	sound() {
		return 'Screetch'
	}
}
