import { CustomPermissionSchema } from "../data/CustomPermissionSchema.mjs";
import { PermissionModel } from "../data/PermissionModel.mjs";
const fields = foundry.data.fields;

export class PermissionManager {
	/** @type {Map<string, CustomPermission>} */
	static #validPermissions = new Map();
	static #permissionCache = new Map();

	/**
	 * Registers a new permission with the system, most of these will come from a
	 * manifest file, but could happen outside of that as required.
	 *
	 * @param {"world"|"system"|string} scope The scope of the setting
	 * @param {Object} permissionData The data of the setting
	 * @returns {String|void} The error encountered during permission registration
	 */
	static register(scope, permissionData) {
		console.log(`pm | attempting to register`, scope, permissionData)
		// Validate the data
		if (CustomPermissionSchema.validate(permissionData)) {
			return `Invalid permission data: ${JSON.stringify(permissionData)}`;
		};

		const qualifiedPermission = this.qualifyPermission(scope, permissionData.id);

		// Ensure the permission doesn't exist already
		if (this.#validPermissions.has(qualifiedPermission)) {
			return `Permission "${qualifiedPermission}" already exists`;
		};

		// Add the permission
		this.#validPermissions.set(qualifiedPermission, permissionData);
		game.settings.register(
			`permission-manager`,
			qualifiedPermission,
			{
				config: false,
				requiresReload: false,
				type: PermissionModel,
				default: permissionData.default ?? [CONST.USER_ROLES.GAMEMASTER],
			}
		);
		return true;
	};

	/**
	 * Retrieves a list of roles that have the permission, this checks the cache
	 * if we've retrieved it previously, and sets the roles within the cache if
	 * it isn't already there.
	 *
	 * @param {string} qualifiedPermission The fully qualified permission string
	 * @returns The list of roles with that permission
	 */
	static #getRoles(qualifiedPermission) {
		if (this.#permissionCache.has(qualifiedPermission)) {
			return this.#permissionCache.get(qualifiedPermission);
		};
		const roles = game.settings.get(`permission-manager`, qualifiedPermission);
		this.#permissionCache.set(qualifiedPermission, roles);
		return roles;
	};

	/**
	 * Checks if a user has a specific permission
	 *
	 * @param {"world"|"system"|"module"} scope The permission's scope
	 * @param {string} permission The permission ID
	 * @param {User|undefined} user
	 * @returns Whether or not the
	 */
	static can(scope, permission, user = undefined) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		if (!this.#validPermissions.has(qualifiedPermission)) {
			return false;
		};

		const role = user?.role ?? game.user.role;
		const perms = this.#getRoles(qualifiedPermission);

		return perms ? perms.includes(role) : false;
	};

	// Completely overwrites the permission roles
	static overwrite(scope, permission, roles = []) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		if (!this.#validPermissions.has(qualifiedPermission)) {
			return;
		};
		game.settings.set(`permission-manager`, qualifiedPermission, roles);
		this.#permissionCache.delete(qualifiedPermission);
	};

	// Allows a new role to access a permission
	static allow(scope, permission, role) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		if (!this.#validPermissions.has(qualifiedPermission)) {
			return;
		};

		const perms = this.#getRoles(qualifiedPermission);
		if (perms.includes(role)) return;
		perms.push(role);
		game.settings.set(`permission-manager`, qualifiedPermission, perms);
		this.#permissionCache.delete(qualifiedPermission);
	};

	// Removes a specific role from being able to access a permission
	static disallow(scope, permission, role) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		if (!this.#validPermissions.has(qualifiedPermission)) {
			return;
		};

		const perms = this.#getRoles(qualifiedPermission);
		// TODO: Implement
		game.settings.set(`permission-manager`, qualifiedPermission, perms);
	};

	/** Turns a scope and permission, into a fully qualified permission */
	static qualifyPermission(scope, permission) {
		return `PM.${scope}.${permission}`;
	};

	static get permissions() {
		const perms = [];
		for (const [ permission, data ] of this.#validPermissions.entries()) {
			perms.push({
				...data,
				key: permission,
				roles: this.#getRoles(permission),
			});
		};
		return perms;
	}
};

globalThis.PermissionManager = PermissionManager;
