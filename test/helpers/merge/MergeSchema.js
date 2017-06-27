import 'Helpers/merge/LandAnimalTraits'
import 'Helpers/merge/WaterAnimalTraits'

const transition = {
	transitionToLand: {
		action(superMethod) {
			return `${superMethod()}. Then: ${this.runs(null, 'horizon')}`
		},
		depends: [ 'runs', 'transitionToLand' ]
	}
}

const MergeSchema = {
	merge: [
		{ LandAnimalTraits, use: [ 'run as runs', 'walk' ] },
		{ WaterAnimalTraits, use: [ 'transitionToLand' ] }
	],
	mergeOver: [
		{ transition, use: [ 'transitionToLand' ] }
	]
}

const ErrorMergeSchema = {
	merge: [
		{ LandAnimalTraits, use: [ 'run as runs' ] },
		{ transition, use: [ 'transitionToLand' ] }
	]
}

export {
	MergeSchema,
	ErrorMergeSchema
}
