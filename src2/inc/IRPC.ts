#ifndef IRPC_TS
#define IRPC_TS

#include "IEventProvider.ts"

module akra {
	export enum ERPCPacketTypes {
        FAILURE,
        REQUEST,
        RESPONSE
    }

    export interface IRPCCallback {
        n: uint;
        fn: Function;
        timestamp: uint;
    }

	export interface IRPCPacket {
        n: uint;
        type: ERPCPacketTypes;
        next: IRPCPacket;
    }

    export interface IRPCRequest extends IRPCPacket {
        proc: string;
        argv: any[];
    }

    export interface IRPCResponse extends IRPCPacket  {
        //procedure result
        res: any;
    }

    export interface IRPCOptions {
        addr?: string;
        deferredCallsLimit?: int;       /* -1 - unlimited */
        reconnectTimeout?: int;         /* -1 - never */
        systemRoutineInterval?: int;    /* -1 - never*/
        callbackLifetime?: uint;        /* 0 - immortal */
        procListName?: string;          /* имя процедуры, для получения все поддерживаемых процедур */
        callsFrequency?: int;           /* 0 or -1 - disable group calls */
        context?: any;                  /* контекст, у которого будут вызываться методы, при получении REQUEST запросов со стороны сервера */
    }

	export interface IRPC extends IEventProvider {
		options: IRPCOptions;
        remote: any;
        group: int;

		join(sAddr?: string): void;
		rejoin(): void;
		free(): void;
        detach(): void;
		proc(...argv: any[]): bool;

		parse(pResponse: IRPCResponse): void;
		parseBinary(pData: Uint8Array): void;

        groupCall(): int;
        dropGroupCall(): int;

		signal joined(): void;

        _createRequest(): IRPCRequest;
        _releaseRequest(pReq: IRPCRequest): void;

        _createCallback(): IRPCCallback;
        _releaseCallback(pCallback: IRPCCallback): void;


        _startRoutines(): void;
        _stopRoutines(): void;
        _removeExpiredCallbacks(): void;
	}  
}

#endif

