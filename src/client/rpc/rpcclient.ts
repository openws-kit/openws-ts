import type { JSONType } from "../../common/json";
import type {
	EventMessage,
	NotificationMessage,
	RequestMessage,
	ResponseMessage,
	RpcMessageId,
} from "../../common/rpc";

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (reason: unknown) => void;
};

type EventHandler = (data: unknown) => void;

type SendFn = (msg: string) => void;

/**
 * JSON-RPC client over a generic transport (e.g., WebSocket).
 * Manages requests, notifications, and incoming event handling.
 */
export default class RpcClient {
	private nextId: number;
	private pending: Map<RpcMessageId, PendingRequest>;
	private handlers: Map<string, EventHandler>;
	private send: SendFn;

	/**
	 * @param send - A function to send a JSON string to the remote endpoint.
	 */
	constructor(send: SendFn) {
		this.nextId = 0;
		this.pending = new Map();
		this.handlers = new Map();
		this.send = send;
	}

	/**
	 * Sends a JSON-RPC request and returns a promise that resolves with the result.
	 *
	 * @param method - The remote method name.
	 * @param params - Optional parameters for the method.
	 * @returns A promise resolving to the result.
	 */
	public call<T = JSONType>(method: string, params?: JSONType): Promise<T> {
		const id = this.nextId++;
		const message: RequestMessage = {
			jsonrpc: "2.0",
			id,
			method,
			params,
		};

		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, { resolve: resolve as (val: unknown) => void, reject });
			this.send(JSON.stringify(message));
		});
	}

	/**
	 * Sends a JSON-RPC notification (no response expected).
	 *
	 * @param method - Notification method.
	 * @param params - Optional parameters.
	 */
	public notify(method: string, params?: JSONType): void {
		const message: NotificationMessage = {
			jsonrpc: "2.0",
			method,
			params,
		};
		this.send(JSON.stringify(message));
	}

	/**
	 * Registers an event handler for a server-side event.
	 *
	 * @param event - Event name.
	 * @param handler - Callback to handle the event.
	 */
	public on<T>(event: string, handler: (data: T) => void): void {
		this.handlers.set(event, handler as EventHandler);
	}

	/**
	 * Processes a raw JSON message received from the server.
	 * Should be connected to a message event (e.g., WebSocket onmessage).
	 *
	 * @param raw - Raw JSON message string.
	 */
	public receive(raw: string): void {
		let message: unknown;

		try {
			message = JSON.parse(raw);
		} catch {
			return;
		}

		if (!message || typeof message !== "object") return;

		if ("id" in message) {
			const { id, result, error } = message as ResponseMessage;
			const entry = this.pending.get(id);
			if (!entry) return;

			this.pending.delete(id);
			error ? entry.reject(error) : entry.resolve(result);
		} else if ("event" in message) {
			const { event, data } = message as EventMessage;
			const handler = this.handlers.get(event);
			if (handler) handler(data);
		}
	}
}
