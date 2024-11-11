type PermissionModel = (1 | 2 | 3 | 4)[];

interface CustomPermission {
	id: string;
	gm: "never" | null | "always";
	default: PermissionModel;
	name: string;
	hint: string;
}
