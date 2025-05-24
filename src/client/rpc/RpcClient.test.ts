import { beforeEach, describe, expect, it, vi } from "vitest";
import RpcClient from "./RpcClient";

let sendMock: ReturnType<typeof vi.fn>;
let client: RpcClient;

beforeEach(() => {
	sendMock = vi.fn();
	client = new RpcClient(sendMock);
});

describe("RpcClient", () => {
	it("sends a call and resolves with result", async () => {
		const promise = client.call("test.method", { a: 1 });
		const call = sendMock.mock.calls[0];
		expect(call).toBeDefined();
		const sent = JSON.parse(call?.[0]);

		expect(sent.method).toBe("test.method");
		expect(sent.params).toEqual({ a: 1 });

		client.handle(JSON.stringify({ jsonrpc: "2.0", id: sent.id, result: 42 }));
		await expect(promise).resolves.toBe(42);
	});

	it("sends a call and rejects with error", async () => {
		const promise = client.call("fail.method");
		const call = sendMock.mock.calls[0];
		expect(call).toBeDefined();
		const sent = JSON.parse(call?.[0]);

		client.handle(JSON.stringify({ jsonrpc: "2.0", id: sent.id, error: "failure" }));
		await expect(promise).rejects.toBe("failure");
	});

	it("sends a notification", () => {
		client.notify("notify.method", { x: 5 });
		const call = sendMock.mock.calls[0];
		expect(call).toBeDefined();
		const sent = JSON.parse(call?.[0]);

		expect(sent.method).toBe("notify.method");
		expect(sent.params).toEqual({ x: 5 });
		expect(sent).not.toHaveProperty("id");
	});

	it("handles events with registered handler", () => {
		const handler = vi.fn();
		client.on("server.event", handler);

		client.handle(JSON.stringify({ jsonrpc: "2.0", event: "server.event", data: { foo: "bar" } }));
		expect(handler).toHaveBeenCalledWith({ foo: "bar" });
	});

	// it("ignores malformed JSON", () => {
	// 	expect(() => client.handle("not json")).not.toThrow();
	// });

	it("ignores invalid message types", () => {
		expect(() => client.handle(JSON.stringify({ nonsense: true }))).not.toThrow();
	});

	it("ignores unknown response id", () => {
		expect(() => client.handle(JSON.stringify({ jsonrpc: "2.0", id: 123, result: "ok" }))).not.toThrow();
	});
});
