import './Mixin'

export function MixinProvider(app) {
	Mixin.mixins = { }
	app.mixins = Mixin
}

MixinProvider.priority = 100
