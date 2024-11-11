const loaders = {
	js() {window.location.reload()},
	mjs() {window.location.reload()},
	css() {window.location.reload()},
};

Hooks.on(`hotReload`, async (data) => {
	if (!loaders[data.extension]) return;
	return loaders[data.extension](data);
});
