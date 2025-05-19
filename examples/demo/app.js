import define from "./libs/framework.min.js";
import Html from "./plugins/html.js";
import Loader from "./plugins/loader.js";

export const app = initFramework();

function initFramework() {
	const framework = define({
		base: "/",
		shadow: false,
		callback: async ({ $this }) => {
			// Add support for HTML-slots without Shadow DOM
			if ($this.shadowRoot)
				return;

			const def = [], named = {};
			Array.from($this.childNodes).forEach(n => {
				$this.removeChild(n);
				(n.nodeType === 1 && n.getAttribute("slot") ? (named[n.getAttribute("slot")] ??= []) : def).push(n);
			});
			await new Promise(resolve => setTimeout(resolve));
			$this.querySelectorAll("slot").forEach(s => {
				const name = s.getAttribute("name");
				const content = name ? named[name] : def;
				content?.length && s.replaceWith(...content);
			});
		}
	});

	framework.render(document.body, framework.app["app-main"]);

	// Add framework plugins
	framework.use("Loader", Loader);
	framework.use("HTML", Html);

	return framework;
}