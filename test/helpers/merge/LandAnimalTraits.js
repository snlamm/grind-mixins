import fs from 'fs'

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
	},

	awaitMeals(meals, food) {
		// make the function asynchronous
		return Promise.resolve(fs.readdir('./test/helpers/merge')).then(() => {
			meals.push(food)
		})
	}
}
