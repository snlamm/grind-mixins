export class AnimalClass {
	swim() {
		return 'Can`t swim'
	}

	run() {
		return 'Can`t run'
	}

	typeOf(species) {
		return `I am a(n) ${species}`
	}

	environments(types = [ ]) {
		return types
	}

}
