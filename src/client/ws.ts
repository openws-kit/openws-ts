/**
 * Establishes a WebSocket connection asynchronously and returns the connected instance.
 *
 * @param url - The WebSocket server URL.
 * @returns A Promise that resolves with a connected WebSocket instance.
 *
 * @throws Will reject with an error string if the connection fails.
 * - `"Wrong URL"` if the server cannot be reached (code 1006).
 * - `"Unknown error"` for other closure reasons before opening.
 */
export async function openWebSocket(url: string): Promise<WebSocket> {
	return new Promise((resolve: (val: WebSocket) => void, reject) => {
		const ws = new WebSocket(url);

		ws.onopen = () => {
			resolve(ws);
		};

		ws.onclose = (event: CloseEvent) => {
			switch (event.code) {
				case 1006:
					reject("Wrong URL");
					break;
				default:
					reject("Unknown error");
			}
		};
	}).then((ws) => {
		// Clear the listeners before returning
		ws.onopen = ws.onclose = null;
		return ws;
	});
}
