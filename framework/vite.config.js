import { transform } from "esbuild";
import { resolve } from "path";
import { minify } from "terser";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		target: "esnext",
		minify: false,
		lib: {
			entry: resolve(__dirname, "src/main.js"),
			formats: ["es", "esm"],
			fileName: format => `vendor${format === "esm" ? ".min" : ""}.js`,
		},
		rollupOptions: {
			treeshake: "smallest",
			plugins: [esbuildMinify(), terserMinify()],
		},
	},
})

function terserMinify() {
	return {
		name: "terserMinify",
		async generateBundle(_options, bundle) {
			for (let key in bundle) {
				if (bundle[key].type !== "chunk" || !key.endsWith(".min.js"))
					continue

				const minifyCode = await minify(bundle[key].code, {
					sourceMap: false,
					compress: {
						passes: 2,
						drop_console: true,
						drop_debugger: true,
					},
					mangle: {
						properties: {
							regex: /^_.+/,
						},
					},
					format: {
						wrap_func_args: false,
						comments: false,
					},
					toplevel: true,
				})
				bundle[key].code = minifyCode.code
			}
			return bundle
		},
	}
}

function esbuildMinify() {
	return {
		name: "esbuildMinify",
		renderChunk: {
			order: "post",
			async handler(code, chunk, outputOptions) {
				if (outputOptions.format === "es" && chunk.fileName.endsWith(".min.js"))
					return await transform(code, { minify: true });
				return code;
			},
		}
	};
}