import htm from "../libs/xhtm.min.js";

export default class HTML {

	constructor() {
		this.scoped = 0;
		this._buffer = "";
		this._scopedId = null;
		this._scopedStack = [];
	}

	#scopeSelectors(line, scopeAttr, stack) {
		const trimmed = line.trim();
		if (!trimmed) return "";

		const isAtRule = trimmed.startsWith("@");
		if (isAtRule) {
			stack.push(/@(media|supports)\b/.test(trimmed));
			return line;
		}

		const isScoped = stack.length === 0 || stack[stack.length - 1];
		stack.push(false);
		if (!isScoped)
			return line;

		// Only scope if top-level or inside at-rule block
		return line.split(",").map(sel => {
			sel = sel.trim();
			if (sel.startsWith(":root"))
				return `${scopeAttr}${sel.slice(5)}`;
			return `${scopeAttr} ${sel}`;
		}).join(", ");
	}

	#style(cssChunk, el) {
		const scopedId = el.dataset?.css;
		if (!scopedId) return cssChunk;

		if (this._scopedId !== scopedId) {
			this._buffer = "";
			this._scopedId = scopedId;
			this._scopedStack = [];
		}

		const scopeAttr = `[data-css="${scopedId}"]`;
		this._buffer += cssChunk;

		let result = "", buffer = "";
		this._buffer.replace(/([^{}]+)|({)|(})/g, (_, text, open, close) => {
			if (open) {
				result += `${this.#scopeSelectors(buffer, scopeAttr, this._scopedStack)}{`;
				buffer = "";
			} else if (close) {
				result += `${buffer}}`;
				buffer = "";
				this._scopedStack.pop();
			} else {
				buffer += text;
			}
		});

		this._buffer = buffer.trim();
		return result;
	}

	#isLightDOM(el) {
		return !(el.getRootNode() instanceof ShadowRoot);
	}

	html({ app, $this }, ...args) {
		const tagHandler = (type = "", props = {}, ...children) => {

			if (type === "style" && this.#isLightDOM($this)) {
				if (!$this.dataset?.css)
					$this.setAttribute("data-css", ++this.scoped);

				children = children.map(c => typeof c === "string" ? this.#style(c, $this) : c);
			}

			return app(props?.xmlns)[type](props, ...children);
		}
		return htm.bind(tagHandler)(...args);
	}
}