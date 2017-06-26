export class MixinError extends Error {
	constructor(message) {
		super(message)

		this.name = this.constructor.name
	}
}
