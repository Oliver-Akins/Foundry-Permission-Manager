import { filePath } from "../consts.mjs";

const { api, } = foundry.applications;

export class PermissionMenu extends api.HandlebarsApplicationMixin(api.ApplicationV2) {
	static DEFAULT_OPTIONS = {
		classes: [
			`permission-manager`,
			`custom-permission-menu`,
		],
		position: {
			width: 650,
			height: 650,
		},
		tag: `form`,
		window: {
			icon: `fas fa-gear`,
			title: `PM.Application.PermissionMenu.title`,
			resizable: true,
		},
		actions: {
			filter: this.#onFilter,
		},
		form: {
			closeOnSubmit: true,
			handler: this.#onSubmit,
		},
	};

	static PARTS = {
		navigation: {
			template: filePath(`templates/PermissionMenu/navigation.hbs`),
		},
		permissions: {
			template: filePath(`templates/PermissionMenu/permissionList.hbs`),
			scrollable: [`.permissions-table`]
		},
		footer: {
			template: filePath(`templates/PermissionMenu/footer.hbs`),
		},
	};

	filterGroups = {
		perms: "",
	};

	async _preparePartContext(partId, ctx, opts) {
		ctx = await super._preparePartContext(partId, ctx, opts);
		partId = partId.slice(0,1).toUpperCase() + partId.slice(1);
		if (this[`_prepare${partId}Context`] != null) {
			ctx = await this[`_prepare${partId}Context`](ctx, opts);
		};
		return ctx;
	};

	async _prepareNavigationContext(ctx) {
		ctx.scopes = PermissionManager.scopes.map((scope) => {
			if (scope === `world`) {
				return { scope, name: `World` };
			}
			else if (scope === `system`) {
				return { scope, name: game.system.title };
			};
			return {
				id: scope,
				name: game.modules.get(scope)?.title ?? scope,
			};
		});
		return ctx;
	}

	async _preparePermissionsContext(ctx) {
		const roles = CONST.USER_ROLES;
		const gmRole = roles.GAMEMASTER;

		// Configure permission roles
		ctx.perms = [];
		for (const perm of PermissionManager.permissions) {
			const rolePerms = [];
			for (const role of Object.values(roles)) {
				if (role === roles.NONE) { continue };

				let checked = perm.roles.has(role);
				if (perm.gm != null && role === gmRole) {
					checked &&= perm.gm === "always"
				};

				rolePerms.push({
					name: `${perm.key}.${role}`,
					checked,
					readonly: perm.gm != null && role === gmRole,
				});
			};

			const { scope, } = PermissionManager.unqualifyPermission(perm.key);

			ctx.perms.push({
				key: perm.key,
				scope,
				name: game.i18n.localize(perm.name ?? perm.key),
				hint: game.i18n.localize(perm.hint),
				perms: rolePerms,
				visible: [scope, ""].includes(this.filterGroups.perms),
			});
		};

		return ctx;
	};

	static async #onSubmit(_event, _form, formData) {
		const perms = formData.object;

		const permissionsToSave = {};
		for (const key in perms) {
			const keyParts = key.split(`.`)
			const qualifiedPermission = keyParts.slice(0, -1).join(`.`);
			permissionsToSave[qualifiedPermission] ??= [];

			if (!perms[key]) { continue; };

			const role = parseInt(keyParts.at(-1));
			permissionsToSave[qualifiedPermission].push(role);
		};

		for (const qualified in permissionsToSave) {
			PermissionManager.overwrite(qualified, permissionsToSave[qualified]);
		};
	};

	static async #onFilter(_event, element) {
		const { group, scope, } = element.dataset;
		this.filterGroups[group] = scope;

		const filterableElements = this.element.querySelectorAll(`.filterable[data-group="${group}"]`);
		for (const el of filterableElements) {
			if (scope === "") {
				el.classList.add(`visible`);
				continue;
			}
			const isScope = scope === el.dataset.scope;
			if (el.classList.contains(`visible`) && !isScope) {
				el.classList.remove(`visible`);
			}
			else if (isScope) {
				el.classList.add(`visible`);
			};
		};
	};
};

globalThis.PermissionMenu = PermissionMenu;
