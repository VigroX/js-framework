export default ({ app, html, state, mount }) => {
	const controller = new AbortController();
	const isOpen = state(false);
	const active = state(location.hash || "#1");
	const pages = {
		"#1": "main-section1",
		"#2": "main-section2"
	}

	const section = state(() => app.render(app["section"]({ class: "active" }), app[pages[active.val]]()));

	const navigate = (event) => {
		event.preventDefault();

		if (active.val === event.target.hash)
			return;

		isOpen.val = false;
		active.val = event.target.hash;
		location.hash = event.target.hash;
	}

	const header = html`
		<header>
			<label class=${() => `nav-open ${isOpen.val ? 'active' : ''}`} onclick=${() => isOpen.val = !isOpen.val}>
				<span></span>
			</label>
			<h1>Demo</h1>
		</header>
	`;

	const nav = html`
		<nav class=${() => isOpen.val ? "open" : "closed"}>
			<p>Navigation</p>
			<ul class="show">
				<li>
					<a href="#1" onclick=${navigate} class=${() => active.val === "#1" ? "active" : ""}>Page 1</a>
					<a href="#2" onclick=${navigate} class=${() => active.val === "#2" ? "active" : ""}>Page 2</a>
				</li>
			</ul>
		</nav>
	`;

	mount(() => {
		document.addEventListener("click", (ev) => {
			if (isOpen.val && !(nav.contains(ev.target) || header.contains(ev.target)))
				isOpen.val = !isOpen.val;
		}, { signal: controller.signal });
		return () => {
			controller.abort();
		}
	})

	return html`
		${header}
		${nav}
		<main>
			${section}
		</main>
		<footer>
			<p>GitHub: <a href="https://github.com/VigroX/js-framework" target="_blank">js-framework</a></p>
		</footer>
		<style>
			:root {
				display: grid;
				margin: 0;
				height: 100vh;
				grid-template-columns: auto;
				grid-template-rows: auto 1fr auto;
				grid-template-areas:
					"hdr"
					"main"
					"ftr";
				background-color: #efefef;
			}

			header {
				display: flex;
				grid-area: hdr;
				padding: 20px;
				background-color: #303e45;
				border-bottom: 2px solid #151c1f;
				color: #dfdfdf;

				h1 {
					margin: 0 auto;
					max-width: 1060px;
					width: 100%;
				}

				label.nav-open {
					display: block;
					width: 30px;
					height: 26px;
					margin: 0 40px 0 0;
					position: relative;
					cursor: pointer;
					left: 10px;
					top: 10px;
					z-index: 10;

					span {
						display: block;
						position: relative;
						visibility: unset;
						height: 3px;
						top: 50%;
						transition: visibility 0s 0.3s, background-color 0s 0.3s;
						background-color: #dfdfdf;

						&:before,
						&:after {
							position: absolute;
							width: 100%;
							height: 3px;
							content: "";
							background-color: #dfdfdf;
							transition-duration: 0.1s, 0.3s;
							transition-delay: 0.3s, 0s;
						}

						&:before {
							bottom: 10px;
							transition-property: bottom, transform;
						}

						&:after {
							top: 10px;
							transition-property: top, transform;
						}
					}

					&.active {
						span {
							background: none;

							&:before {
								bottom: 1px;
								transform: rotate(-45deg);
								transition-delay: 0s, 0.3s;
								background-color: #dfdfdf;
							}

							&:after {
								top: -1px;
								transform: rotate(45deg);
								transition-delay: 0s, 0.3s;
								background-color: #dfdfdf;
							}
						}
					}
				}
			}

			nav {
				position: fixed;
				height: calc(100% - 88px);
				width: 0;
				top: 0;
				left: 0;
				z-index: 1;
				background-color: #151c1f;
				overflow-x: hidden;
				transition: 0.5s;
				padding-top: 88px;

				a {
					display: block;
					padding: 8px 0px 8px 32px;
					text-decoration: none;
					font-size: 20px;
					color: #a7a7a7;
					transition: 0.3s;
					border-top: 2px solid #303e45;
					white-space: pre;
					user-select: none;
					transition-property: background-color, color;
					transition-duration: 150ms;
					transition-timing-function: linear;
					-webkit-tap-highlight-color: rgba(0, 0, 0, 0);

					&.active {
						color: #FFF;
						pointer-events: none;
					}

					&:hover {
						color: #f1f1f1;
					}
				}

				p {
					background-color: #303e45;
					padding: 8px 0px 8px 12px;
					margin: 0;
					color: #FFF;
					white-space: pre;
					cursor: default;
					user-select: none;
					transition: 150ms background-color;
				}

				ul {
					list-style: none;
					padding: 0;
					margin: 0;

					li {
						display: none;
						overflow-x: hidden;
						background-color: #242e33;
						padding-left: 8px;
						overflow-y: auto;

						a:hover {
							background-color: #425056;
						}
					}

					&.show li {
						display: block;
						padding: 0;
					}
				}

				&.open {
					width: 250px;
				}
			}

			main {
				grid-area: main;
				margin: 12px auto;
				border-radius: 10px;
				box-shadow: 0 0 1rem 0 rgba(0, 0, 0, .2);
				max-width: 1000px;
				overflow-x: hidden;
				width: 100%;
				color: #000;

				section {
					display: block;
					visibility: hidden;

					&.active {
						animation: 500ms fadeIn;
						animation-fill-mode: forwards;
						padding: 20px;
					}
				}
			}

			footer {
				grid-area: ftr;
				font-size: 14px;
				padding: 10px;
				background-color: #303e45;
				border-top: 2px solid #151c1f;
				color: #FFF;

				p {
					margin: 0 auto;
					max-width: 975px;
				}
			}

			@keyframes fadeIn {
				0% {
					visibility: hidden;
					opacity: 0;
				}
				50% {
					opacity: 0;
				}
				100% {
					visibility: visible;
					opacity: 1;
				}
			}
		</style>
	`
}