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

export default class RpcClient {
	private id: number;
	private pending: Map<RpcMessageId, PendingRequest>;
	private handlers: Map<string, EventHandler>;
	private sendRaw: SendFn;

	constructor(send: SendFn) {
		this.id = 0;
		this.pending = new Map();
		this.handlers = new Map();
		this.sendRaw = send;
	}

	public call<T = JSONType>(method: string, params?: JSONType): Promise<T> {
		const id = this.id++;
		const msg: RequestMessage = {
			jsonrpc: "2.0",
			id,
			method,
			params,
		};

		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, {
				resolve: resolve as (val: unknown) => void,
				reject,
			});
			this.sendRaw(JSON.stringify(msg));
		});
	}

	public notify(method: string, params?: JSONType): void {
		const msg: NotificationMessage = {
			jsonrpc: "2.0",
			method,
			params,
		};
		this.sendRaw(JSON.stringify(msg));
	}

	public on<T>(event: string, handler: (data: T) => void): void {
		this.handlers.set(event, handler as EventHandler);
	}

	public handleMessage(raw: string): void {
		let msg: unknown;
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}
		if (!msg || typeof msg !== "object") return;

		if ("id" in msg) {
			const { id, result, error } = msg as ResponseMessage;
			const entry = this.pending.get(id);
			if (!entry) return;

			this.pending.delete(id);
			if (error) {
				entry.reject(error);
			} else {
				entry.resolve(result);
			}
		} else if ("event" in msg) {
			const { event, data } = msg as EventMessage;
			const handler = this.handlers.get(event);
			if (handler) handler(data);
		}
	}
}
