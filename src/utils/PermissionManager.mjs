import { CustomPermissionSchema } from "../data/CustomPermissionSchema.mjs";

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
				scope: `world`, // I set this to world and suddenly it's not working any more?
				requiresReload: permissionData.requiresReload,
				type: Set,
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
		// if (this.#permissionCache.has(qualifiedPermission)) {
		// 	return this.#permissionCache.get(qualifiedPermission);
		// };
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
		const qualified = this.qualifyPermission(scope, permission);
		if (!this.#validPermissions.has(qualified)) {
			return false;
		};

		const role = user?.role ?? game.user.role;
		/** @type {CustomPermission} */
		const permData = this.#validPermissions.get(qualified);
		const perms = this.#getRoles(qualified);

		if (permData.gm !== null && role === CONST.USER_ROLES.GAMEMASTER) {
			return permData.gm === "always";
		};

		return perms ? perms.includes(role) : false;
	};

	static overwrite(qualified, roles) {
		if (!this.#validPermissions.has(qualified)) {
			return;
		};
		/** @type {Set<1 | 2 | 3 |4>} */
		const currentRoles = this.#getRoles(qualified);

		/** @type {Set<1 | 2 | 3 |4>} */
		const changed = currentRoles.symmetricDifference(new Set(roles));
		if (changed.size === 0) {
			console.log(`Ignoring update for: ${qualified}`)
			return;
		}

		console.log(`overwriting perm: ${qualified}`)
		game.settings.set(`permission-manager`, qualified, roles);
		this.#permissionCache.delete(qualified);
	};

	// Completely overwrites the permission roles
	static overwriteUnqualified(scope, permission, roles) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		this.overwrite(qualifiedPermission, roles)
	};

	static allow(qualified, role) {
		if (!this.#validPermissions.has(qualified)) {
			return;
		};

		const perms = this.#getRoles(qualified);
		if (perms.includes(role)) return;
		perms.push(role);
		game.settings.set(`permission-manager`, qualified, perms);
		this.#permissionCache.delete(qualified);
	};

	// Allows a new role to access a permission
	static allowUnqualified(scope, permission, role) {
		const qualifiedPermission = this.qualifyPermission(scope, permission);
		this.allow(qualifiedPermission, role);
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
		return `${scope}.${permission}`;
	};

	static unqualifyPermission(qualified) {
		const [ scope, permission ] = qualified.split(`.`, 1);
		return { scope, permission };
	};

	static get scopes() {
		const scopes = new Set();
		for (const qualified of this.#validPermissions.keys()) {
			const { scope, } = this.unqualifyPermission(qualified);
			scopes.add(scope);
		};
		return [...scopes];
	};

	static get permissions() {
		const perms = [];
		for (const [ permission, data ] of this.#validPermissions.entries()) {
			perms.push({
				id: data.id,
				key: permission,
				name: data.name,
				hint: data.hint,
				gm: data.gm,
				roles: this.#getRoles(permission),
			});
		};
		return perms;
	}
};

globalThis.PermissionManager = PermissionManager;
