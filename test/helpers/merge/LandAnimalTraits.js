export const LandAnimalTraits = {
	run(_, location) {
		return `Runs toward the ${location}`
	},

	walk() {
		return 'walks'
	},

	catchAnimal(type) {
		return `Yummy ${type}`
	},

	hunt() {
		return 'Looks in the bushes'
	},

	environments(types) {
		types.push('grasslands')
	}
}
