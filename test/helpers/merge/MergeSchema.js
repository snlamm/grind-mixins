import 'Helpers/merge/LandAnimalTraits'
import 'Helpers/merge/WaterAnimalTraits'

const transition = {
	transitionToLand: {
		action(superMethod) {
			return `${superMethod()}. Then: ${this.runs(null, 'horizon')}`
		},
		depends: [ 'runs' ]
	}
}

export const MergeSchema = {
	merge: [
		// TODO take out walk and transitionToLand should throw an error!
		{ LandAnimalTraits, use: [ 'run as runs', 'walk' ] },
		{ WaterAnimalTraits, use: [ 'transitionToLand' ] }
	],
	mergeOver: [
		{ transition, use: [ 'transitionToLand' ] }
	]
}
