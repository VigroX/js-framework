export default class Loader {

    constructor({
        app,
        root = document,
        base = "components"
    }) {
        this.app = app;
        this.options = { components: base };
        this.observer = new MutationObserver(async (mutations) => {
            for (const node of mutations.flatMap(m => [...m.addedNodes])) {
                if (node instanceof HTMLElement)
                    await this.#check(node?.shadowRoot ?? node);
            }
        });
        this.observer.observe(root, { childList: true, subtree: true });
        this.#check(document.body);
    }

    async #check(node) {
        const notDefined = [...node?.querySelectorAll(":not(:defined)") ?? []];
        if (!notDefined.length)
            return

        return Promise.all(notDefined.map(async ({ localName: tag }) => {
            try {
                const module = await import(`../${this.options.components}/${tag.split("-").join("/")}.js`);
                if (customElements.get(tag))
                    return;

                // Register component
                this.app(tag, module.default, module.options);

                // Loop through DOM check for components
                for (const e of node.querySelectorAll(tag)) {
                    await this.#check(e?.shadowRoot ?? e);
                }
            } catch (e) {
                console.warn(tag, e);
            }
        }));
    }
}