import htm from "xhtm";

export default class HTML {

	html({ app }, ...args) {
		const tagHandler = (type = "", props = {}, ...children) => {
			return app(props?.xmlns)[type](props, ...children);
		}
		return htm.bind(tagHandler)(...args);
	}
}