import { PermissionManager } from "./utils/PermissionManager.mjs";
import helpers from "./utils/handlebars_helpers/_index.mjs";
import "./Applications/PermissionMenu.mjs";
import "./hooks/hotReload.mjs";

Hooks.once(`init`, () => {
	game.settings.registerMenu(`permission-manager`, `custom-permissions`, {
		name: `Custom Permissions`,
		label: `Configure Custom Permissions`,
		type: PermissionMenu,
		restricted: true,
	});
	Handlebars.registerHelper(helpers);
});

Hooks.once(`setup`, () => {

	// Load the world permissions
	const worldPermissions = game.world.flags["permission-manager"]?.customPermissions ?? [];
	worldPermissions.forEach((p) => PermissionManager.register(`world`, p));

	// Load the system permissions
	game.system.flags["permission-manager"]?.customPermissions?.forEach(p => PermissionManager.register(`system`, p));

	// Load permissions from modules
	for (const module of game.modules) {
		console.log(`trying to get permissions from ${module.id}`, module.flags["permission-manager"]);
		module.flags["permission-manager"]?.customPermissions?.forEach(p => PermissionManager.register(module.id, p))
	};
});
