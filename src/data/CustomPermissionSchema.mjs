import { PermissionModel } from "./PermissionModel.mjs";

const fields = foundry.data.fields;

export const CustomPermissionSchema = new fields.SchemaField({
	id: new fields.StringField({
		required: true,
		nullable: false,
		blank: false,
		trim: true,
	}),
	gm: new fields.StringField({
		required: false,
		initial: null,
		nullable: true,
		options: ["always", "never"],
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
