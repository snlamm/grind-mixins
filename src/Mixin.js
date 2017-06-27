/* eslint-disable max-lines */
import './MixinError'
import { mix } from './Mix'

export class Mixin {
	static mixins = { }
	static mix = mix
	static mergeTypes = {
		merge: { },
		mergeOver: { override: true },
		prepend: { before: true },
		awaitPrepend: { before: true, promisify: true },
		append: { after: true },
		awaitAppend: { after: true, promisify: true },
	}
	static prototypeType = 'onPrototype'

	static buildChain(name, mixin) {
		// can optionally pass in the function only and we'll attempt to derive the mixin name
		if(typeof name === 'function' && mixin.isNil) {
			mixin = name
			name = name.name
		}

		if(name.isNil || name === '') {
			throw new MixinError('Mixin missing name: cannot generate default name')
		}

		if(this.mixins[name]) {
			throw new MixinError(`Invalid mixin name: ${name} already exists`)
		}

		this.mixins[name] = mixin
	}

	static buildMerge(name, mixin) {
		if(typeof name !== 'string' || typeof mixin !== 'object') {
			throw new MixinError('buildMerge(name, mixin) `name` must be a string and `mixin` must be an object')
		}

		if(this.mixins[name]) {
			throw new MixinError(`Invalid mixin name: ${name} already exists`)
		}

		this.mixins[name] = {
			name: name,
			keys: Reflect.ownKeys(mixin),
			logic: mixin
		}
	}

	static register(targetClass, methodName = 'mergeMixins') {
		const mergeSchema = targetClass[methodName]

		if(mergeSchema.isNil || (typeof mergeSchema !== 'object')) {
			throw new MixinError(`Failed to register: missing mergeSchema method: ${methodName}`)
		}

		return this.structure(targetClass, mergeSchema)
	}

	static structure(target, mergeSchema, usesPrototype = false) {
		for(const [ mergeMethod, mixins ] of Object.entries(mergeSchema)) {
			const type = mergeMethod.split(/\d+$/)[0]

			if(type === this.prototypeType) {
				this.structure(target, mergeSchema[mergeMethod], true)
				continue
			}

			if(!Object.keys(this.mergeTypes).includes(type)) {
				throw new MixinError(`Unkown merge type: ${type}. Must be ${Object.keys(this.mergeTypes).join(', ')}`)
			}

			const options = this.mergeTypes[type]

			const expandedMixins = mixins.map(mixin => {
				const type = typeof mixin

				if(type === 'object') {
					return this._structureMixinObject(mixin, usesPrototype)
				} else if(type === 'string') {
					return this._structureMixinString(mixin, usesPrototype)
				}
			})

			this._doMerge(target, options, expandedMixins)
		}
	}

	static _structureMixinObject(mixin, usesPrototype = false) {
		const mixinName = Object.keys(mixin)[0]

		const overrideDepends = mixin.overrideDepends

		if(typeof mixin[mixinName] === 'string') {
			mixin = mixin[mixinName]
		}

		if(typeof mixin === 'string') {
			return this._structureMixinString(mixin, usesPrototype, overrideDepends)
		}

		const isUnNested = (
			Object.keys(mixin[mixinName])[0] === 'action') && (typeof mixin[mixinName].action === 'function'
		)

		if(isUnNested) {
			mixin = { [mixinName]: mixin }
		}

		const use = mixin.use

		mixin = { name: mixinName, keys: Object.keys(mixin[mixinName]), logic: mixin[mixinName] }

		if(!use.isNil) {
			mixin.use = use
		}

		if(!overrideDepends.isNil) {
			this._overrideDependencies(mixin, overrideDepends)
		}

		if(usesPrototype) {
			mixin.usesPrototype = true
		}

		return mixin
	}

	static _structureMixinString(mixin, usesPrototype = false, overrideDepends) {
		const hasUseField = /\(/.test(mixin)
		const mixinName = hasUseField ? mixin.slice(0, mixin.indexOf('(')) : mixin
		const foundMixin = { ...this.mixins[mixinName] }

		if(foundMixin.isNil || Object.keys(foundMixin).length === 0) {
			throw new MixinError(`mixin ${mixinName} is not registered`)
		}

		if(hasUseField) {
			foundMixin.use = mixin.slice(mixin.indexOf('(') + 1, -1).split(', ')
		}

		if(usesPrototype) {
			foundMixin.usesPrototype = true
		}

		if(!overrideDepends.isNil) {
			this._overrideDependencies(foundMixin, overrideDepends)
		}

		return foundMixin
	}

	static _overrideDependencies(mixin, overrideDepends) {
		const overrides = `${overrideDepends},`.split('],').filter(x => x !== '')

		for(const override of overrides) {
			const [ key, dependents ] = override.split(':[')
			let target = mixin.logic[key]

			if(target.isNil) {
				throw new MixinError(`Invalid dependency override: mixin logic ${key} does not exist`)
			}

			if(typeof target === 'function') {
				target = { action() { mixin.logic[key] }, depends: dependents.split(',') }
				mixin.logic[key] = target
			} else if(typeof target === 'object') {
				target.depends = dependents.split(',')
			}
		}
	}

	static _doMerge(targetClass, options, mixins) {
		const isOverride = options.override
		const isHook = options.before || options.after

		for(const { ...mixin } of mixins) {
			const target = mixin.usesPrototype ? targetClass.prototype : targetClass
			const aliases = { }
			const unusedRestrictions = (mixin.use || [ ]).filter(restriction => {
				if(/\sas\s/.test(restriction)) {
					const [ original, alias ] = restriction.split(' as ')
					aliases[original] = alias
					restriction = original
				}

				return !mixin.keys.includes(restriction)
			})

			if(unusedRestrictions.length > 0) {
				throw new MixinError(`Invalid export: mixin attributes do not exist: ${unusedRestrictions.join(', ')}`)
			}

			if(Array.isArray(mixin.use) && mixin.use.length > 0) {
				mixin.keys = mixin.keys.filter(key => mixin.use.includes(key) || Object.keys(aliases).includes(key))
			}

			for(const property of mixin.keys) {
				const targetPropertyName = aliases[property] || property
				const targetPropertyCall = target[targetPropertyName]
				let mixinPropertyCall =  mixin.logic[property]
				let missingDependents = null

				if(typeof mixinPropertyCall === 'object') {
					missingDependents = (mixinPropertyCall.depends || [ ]).filter(dependent => !target[dependent])
					mixinPropertyCall = mixinPropertyCall.action
				}

				const hasProperty = !!targetPropertyCall

				this._validateMethodUsage(mixin, targetPropertyName, hasProperty, isHook, isOverride, missingDependents)

				Object.defineProperty(target, targetPropertyName, {
					value: function(...args) {
						if(!isHook && !isOverride) {
							return mixinPropertyCall.apply(this, args)
						} else if(!isHook && isOverride) {
							return mixinPropertyCall.call(this, targetPropertyCall.bind(this), ...args)
						} else if(options.before) {
							if(options.promisify) {
								return Mixin._promisifyPrepend.call(
									this, mixinPropertyCall, targetPropertyCall, ...args
								)
							}

							mixinPropertyCall.apply(this, args)

							return targetPropertyCall.apply(this, args)
						} else if(options.after) {
							if(options.promisify) {
								return Mixin._promisifyAppend.call(
									this, mixinPropertyCall, targetPropertyCall, ...args
								)
							}

							const value = targetPropertyCall.apply(this, args)
							mixinPropertyCall.apply(this, args)

							return value
						}
					},
					writable: true
				})
			}
		}
	}

	static async _promisifyPrepend(mixinPropertyCall, targetPropertyCall, ...args) {
		await mixinPropertyCall.apply(this, args)

		return targetPropertyCall.apply(this, args)
	}

	static async _promisifyAppend(mixinPropertyCall, targetPropertyCall, ...args) {
		const value =  await targetPropertyCall.apply(this, args)
		await mixinPropertyCall.apply(this, args)

		return value
	}

	static _validateMethodUsage(mixin, property, hasProperty, isHook, isOverride, missingDependents) {
		const name = `Mixin ${mixin.name}: `
		if(!missingDependents.isNil && missingDependents.length > 0) {
			const addendum = mixin.usesPrototype ? 'Note: if using prototype, dependents must represent functions.' : ''

			throw new MixinError(
				`${name} Missing dependents for '${property}': [ ${missingDependents.join(', ')} ]. ${addendum}`
			)
		}

		if((!hasProperty && isOverride) || (!isHook && hasProperty && !isOverride)) {
			const overrideMessage = isOverride ? 'Attempting to override' : 'Attempting to add new'
			const propertyMessage = hasProperty ? 'but property already exists' : 'but property does not yet exist'
			const advice = hasProperty ? 'Did you mean to use mergeOver()' : 'Did you mean to use merge()'

			throw new MixinError(`${name} ${overrideMessage} property: '${property}', ${propertyMessage}. ${advice}?`)
		}

		if(isHook && !hasProperty) {
			throw new MixinError(`${name} Invalid attempt to use append/prepend when '${property}' does not yet exist`)
		}
	}

	parentClass = null
	usesPrototype = null

	constructor(parentClass, usesPrototype = false) {
		this.parentClass = parentClass
		this.usesPrototype = usesPrototype
	}

	through(...mixins) {
		return mixins.reduce((chain, mixin) => {
			const name = mixin

			if(typeof mixin === 'string') {
				mixin = this.constructor.mixins[mixin]
			}

			if(typeof mixin !== 'function') {
				throw new MixinError(`Unable to find Mixin: ${name}. Must be function or string assigned in builder`)
			}

			return mixin(chain)
		}, this.parentClass)
	}

	_merge(mergeType, mergeSchema, declare = false) {
		if(!Array.isArray(mergeSchema)) {
			mergeSchema = [ mergeSchema ]
		}

		mergeSchema = { [mergeType]: mergeSchema }

		if(this.usesPrototype) {
			mergeSchema = { onPrototype: mergeSchema }
		}

		this.constructor.structure(this.parentClass, mergeSchema)

		return declare ? this.parentClass : this
	}

	merge(mergeSchema) {
		return this._merge('merge', mergeSchema)
	}

	mergeAndDeclare(mergeSchema) {
		return this._merge('merge', mergeSchema, true)
	}

	mergeOver(mergeSchema) {
		return this._merge('mergeOver', mergeSchema)
	}

	mergeOverAndDeclare(mergeSchema) {
		return this._merge('mergeOver', mergeSchema, true)
	}

	prepend(mergeSchema) {
		return this._merge('prepend', mergeSchema)
	}

	prependAndDeclare(mergeSchema) {
		return this._merge('prepend', mergeSchema, true)
	}

	awaitPrepend(mergeSchema) {
		return this._merge('awaitPrepend', mergeSchema)
	}

	awaitPrependAndDeclare(mergeSchema) {
		return this._merge('awaitPrepend', mergeSchema, true)
	}

	append(mergeSchema) {
		return this._merge('append', mergeSchema)
	}

	appendAndDeclare(mergeSchema) {
		return this._merge('append', mergeSchema, true)
	}

	awaitAppend(mergeSchema) {
		return this._merge('awaitAppend', mergeSchema)
	}

	awaitAppendAndDeclare(mergeSchema) {
		return this._merge('awaitAppend', mergeSchema, true)
	}

	onPrototype(cb) {
		cb(new Mixin(this.parentClass, true))

		return this
	}

}
