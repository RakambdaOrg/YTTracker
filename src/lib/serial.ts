/** Runs async tasks one at a time, so storage read-modify-writes never interleave. */
export function createSerialQueue() {
	let last: Promise<unknown> = Promise.resolve();
	return <T>(task: () => Promise<T>): Promise<T> => {
		const run = last.then(task);
		last = run.catch(() => undefined);
		return run;
	};
}
