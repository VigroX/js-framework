import van from "vanjs-core";
import * as vanX from "vanjs-ext";

// VanJS reactive state modules.
const ref = van.state; // { val, oldVal, rawVal };
const stateProto = Object.getPrototypeOf(ref());
const isState = (value) => Object.getPrototypeOf(value) === stateProto;

const framework = {
	// Global configuration
	config: {
		shadow: { // Default shadow DOM options.
			mode: "open",
		},
		callback: null // Global callback that can be used to extend components on mount.
	},
	plugins: new Map(),

	// Create a DOM tree for a list of elements based on the provided reactive items.
	map: (tag, ...args) => vanX.list(tag instanceof HTMLElement ? tag : van.tags[tag], ...args),

	// Get reactive state without tracking changes or exclude from reactivity.
	raw: (value) => isState(value) ? vanX.raw(value) : vanX.noreactive(value),

	// Render content into the provided DOM element.
	render: (dom, content, replace = false) => (replace ? van.hydrate : van.add)(dom, content),

	// Serialize a reactive object: https://vanjs.org/x#serialization-and-compact
	serialize: vanX.compact
}

// State management for reactive, computed and binding functions.
framework.state = (value, reactive) => {
	// Replace value in existing reactive object.
	if (reactive !== undefined && typeof reactive !== "boolean")
		return vanX.replace(reactive, value);

	// Set binding callback function run on state change.
	if (typeof value === "function")
		// Create derived or computed state.
		return reactive ? vanX.calc(value) : van.derive(value);

	if (typeof value === "object") {
		// Get state fields from existing reactive object.
		if (isState(value))
			return vanX.stateFields(value[!reactive ? "val" : reactive]);

		// Create reactive object
		if (reactive !== false)
			return vanX.reactive(value);
	}

	// Create VanJS state
	return ref(value);
}

// Install plugin modules within the framework.
framework.use = (name, Plugin, args = {}) => {
	if (framework[name])
		throw new Error(name);

	const plugin = new Plugin({ ...args, app: framework.app });
	const methods = {};

	// Bind all public plugin instance methods to preserve context.
	const proto = Object.getPrototypeOf(plugin);
	for (const key of Object.getOwnPropertyNames(proto)) {
		// Create a metod with 'this' to the plugin instance.
		if (key !== "constructor" && typeof proto[key] === "function")
			methods[key] = proto[key].bind(plugin);
	}

	// Add the plugin with methods in the plugin registry.
	framework[name] = plugin;
	framework.plugins.set(name, { plugin, methods });

	return plugin;
};

// Utility to cast value to specified type.
const castToType = (value, type = String) => {
	if (value == null)
		return value;

	if (type === Boolean)
		return value !== "false";

	if (type === Object || type === Array)
		try { return JSON.parse(value); } catch { return type === Object ? {} : []; }

	return type(value);
};

// Register a custom Web Component in the browser.
const defineComponent = (name, elementFunc, options = {}) => {
	if (customElements.get(name))
		return;

	// Destructure options with default options for the component.
	const { callback, metadata = {}, props = {}, shadow = framework.config.shadow } = options;

	// Register the custom element with the resolved base class.
	customElements.define(name, class extends HTMLElement {
		constructor() {
			super();
			Object.assign(this, metadata);
			this.props = {};
			this.dismounts = [];
			this.root = shadow ? this.attachShadow(shadow) : this;
		}

		// Watch prop value for changes required for (attributeChangedCallback).
		static get observedAttributes() {
			return Object.keys(props);
		}

		// Update the corresponding prop value on attribute change.
		attributeChangedCallback(name, _, newValue) {
			this.props[name] && (this.props[name].val = castToType(newValue, props[name]));
		}

		// Component is connected to the DOM.
		connectedCallback() {
			// Context provider that will be passed to all actions and plugins.
			const context = {
				emit: (name, detail, bubbles = false, options = {}) => this.dispatchEvent(new CustomEvent(name, { ...options, detail, bubbles })),
				mount: (fn) => this.dismounts.push(fn?.()),
				props: (name, defaultValue) => this.props[name] ??= ref(this.hasAttribute(name) ? castToType(this.getAttribute(name), props[name]) : defaultValue),
				$this: this,
				...framework
			}

			// Plugin context binding
			framework.plugins.forEach(({ methods }) => {
				for (const key in methods) {
					context[key] = (...args) => methods[key](context, ...args);
				}
			});

			// Callback
			framework.config.callback?.(context); // Global
			callback?.(context); // Local

			// Render the HTML of component
			framework.render(this.root, elementFunc(context));
		}

		// Component is disconnected from the DOM.
		disconnectedCallback() {
			this.dismounts.forEach(dismount => dismount?.());
		}
	});
}

export default config => {
	if (config)
		Object.assign(framework.config, config);

	framework.app = new Proxy(defineComponent, {
		get: (_, tag) => framework[tag] || van.tags[tag],
		apply: (target, _, args) => {
			// Namespace URI (https://vanjs.org/tutorial/#api-tagsns)
			if (args.length === 1)
				return van.tags(args[0]);

			target(...args); // Register component

			return van.tags[args[0]]; // Output component tag
		},
	});

	return framework;
}