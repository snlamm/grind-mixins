export const ChainSimpleBird = parentClass => class extends parentClass {
	movement = null

	constructor() {
		super()

		this.animalType = 'bird'
		this.movement = 'flight'
	}

	uses() {
		return 'beak and talons'
	}

	hunt() {
		return 'Does not hunt'
	}

}
