import { PermissionModel } from "./PermissionModel.mjs";

const fields = foundry.data.fields;

export const CustomPermissionSchema = new fields.SchemaField({
	id: new fields.StringField({
		required: true,
		nullable: false,
		blank: false,
		trim: true,
	}),
	default: PermissionModel,
	name: new fields.StringField({
		required: false,
		nullable: false,
		blank: false,
		trim: true,
	}),
	hint: new fields.StringField({
		required: false,
		nullable: false,
		blank: false,
		trim: true,
	}),
});
