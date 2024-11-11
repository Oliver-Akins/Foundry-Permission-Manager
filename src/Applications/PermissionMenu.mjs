import { filePath } from "../consts.mjs";

const { api, } = foundry.applications;

export class PermissionMenu extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
	static DEFAULT_OPTIONS = {
		classes: [`permission-manager`, `custom-permission-menu`],
		position: {
			width: 650,
			height: 650,
		},
		tag: `form`,
		window: {
			icon: `fas fa-gear`,
			title: `PM.Application.PermissionMenu.title`,
			resizable: true,
		}
	};

	static PARTS = {
		// navigation: {},
		permissions: {
			template: filePath(`templates/PermissionMenu/permissionList.hbs`),
		},
	};

	async _preparePartContext(partId, ctx, opts) {
		ctx = await super._preparePartContext(partId, ctx, opts);
		partId = partId.slice(0,1).toUpperCase() + partId.slice(1);
		if (this[`_prepare${partId}Context`] != null) {
			ctx = await this[`_prepare${partId}Context`](ctx, opts);
		};
		return ctx;
	};

	async _preparePermissionsContext(ctx, opts) {
		// ctx.perms = PermissionManager.permissions;
		const roles = CONST.USER_ROLES;
		const gmRole = roles.GAMEMASTER;

		// Get permission

		// Configure permission roles
		ctx.perms = [];
		for (const perm of PermissionManager.permissions) {
			const rolePerms = [];
			for (const role of Object.values(roles)) {
				if (role === roles.NONE) { continue };
				rolePerms.push({
					name: `${perm.key}.${role}`,
					checked: perm.roles.includes(role) && (!!perm.gm && perm.gm === "always"),
					readonly: perm.gm != null && role === gmRole,
				});
			};
			ctx.perms.push({
				key: perm.key,
				name: game.i18n.localize(perm.name ?? perm.key),
				hint: game.i18n.localize(perm.hint),
				perms: rolePerms,
			});
		};

		console.log(ctx)
		return ctx;
	};
};

globalThis.PermissionMenu = PermissionMenu;
