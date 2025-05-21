import type { JSONType } from "./json";

export type RpcMessageId = number | string;

interface BaseRpcMessage {
	jsonrpc: "2.0";
}

export interface RequestMessage extends BaseRpcMessage {
	id: RpcMessageId;
	method: string;
	params?: JSONType;
}

export interface ResponseMessage extends BaseRpcMessage {
	id: RpcMessageId;
	result?: JSONType;
	error?: {
		code: number;
		message: string;
		data?: JSONType;
	};
}

export interface NotificationMessage extends BaseRpcMessage {
	method: string;
	params?: JSONType;
}

export interface EventMessage extends BaseRpcMessage {
	event: string;
	data?: JSONType;
}
