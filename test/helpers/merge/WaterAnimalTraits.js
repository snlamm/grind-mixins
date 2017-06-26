export const WaterAnimalTraits = {
	swim(superMethod, location) {
		return `Swims toward the ${location}`
	},

	catchFish(type) {
		return `Yummy ${type}`
	},

	hunt() {
		return 'Looks in the water'
	},

	environments(types) {
		types.push('rivers')
	},

	transitionToLand: {
		action() {
			return `${this.swim('shore')}, then ${this.walk()}`
		},
		depends: [ 'walk' ]
	}
}
