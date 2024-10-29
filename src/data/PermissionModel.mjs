const fields = foundry.data.fields;

export const PermissionModel = new fields.SetField(
	new fields.NumberField({ choices: [ 1, 2, 3, 4 ] }),
	{
		required: false,
		initial: [ 4 ],
	},
);
