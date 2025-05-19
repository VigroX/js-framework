export default ({ html, state, mount }) => {
	const counter = state(0);
    const resetCount = () => counter.val = 0;

	setInterval(() => counter.val++, 1000);

	mount(() => {
		console.log("Page 1 - Mounted");
		return () => {
			console.log("Page 1 - Unmounted");
		}
	})

	return html`
		<h2>Page 1</h2>
		<p>Counter 1x: ${counter}</p>
		<p>Counter <span class="special">2x</span>: ${() => counter.val * 2}</p>
        <button onclick=${resetCount}>Reset</button>
		<style>
			.special {
				font-style: italic;
				font-weight: 500;
			}
		</style>
	`
}