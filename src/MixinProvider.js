import './Mixin'

export function MixinProvider(app) {
	app.mixins = Mixin
}

MixinProvider.priority = 100
