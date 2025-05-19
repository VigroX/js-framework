export default class Loader {

	constructor({
		app,
		root = document,
		base = "components",
	}) {
		this.app = app;
		this.options = { components: base };
		this.resolvePath = (tag) => `../${base}/${tag.replace(/-/g, "/")}.js`;
		this.import = this.#import;

		this.observer = new MutationObserver(async (mutations) => {
			for (const node of mutations.flatMap(m => [...m.addedNodes]).filter(n => n instanceof HTMLElement)) {
				await this.#check(node?.shadowRoot ?? node);
			}
		});
		this.observer.observe(root, { childList: true, subtree: true });

		this.#check(document.body);
	}

	async #import(tag, node) {
		try {
			if (!tag.includes("-") || customElements.get(tag))
				return;

			const module = await import(this.resolvePath(tag));

			// Register the custom element
			this.app(tag, module.default, module.options);

			// Check for elements
			if (!node)
				return;

			for (const e of node.querySelectorAll(tag)) {
				await this.#check(e?.shadowRoot ?? e);
			}
		} catch (e) {
			console.warn(tag, e);
		}
	}

	async #check(node) {
		const notDefined = [...node?.querySelectorAll(":not(:defined)") ?? []];

		if (!notDefined.length)
			return;

		return Promise.all(notDefined.map(async (el) => {
			await this.#import(el.localName, node);
		}));
	}
}