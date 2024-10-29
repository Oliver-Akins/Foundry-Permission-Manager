export function iter(start, step, stop) {
	const arr = [];
	while (start <= stop) {
		start += step;
		arr.push(start);
	};
	return arr;
};
