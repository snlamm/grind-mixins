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
		action(swimMethod, walkMethod) {
			if(!swimMethod.isNil && !walkMethod.isNil) {
				return `${this[swimMethod]('shore')}, then ${this[walkMethod]()}`
			}

			return `${this.swim('shore')}, then ${this.walk()}`
		},
		depends: [ 'walk', 'swim' ]
	}
}
