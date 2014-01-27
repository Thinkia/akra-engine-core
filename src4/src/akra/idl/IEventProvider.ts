/// <reference path="IUnique.ts" />

module akra {
	export enum EEventTypes {
		UNICAST,
		BROADCAST
	}

	export interface ISignal<T extends Function> {
		connect(pSignal: ISignal<any>): boolean;
		connect(fnCallback: T, eType?: EEventTypes): boolean;
		connect(fnCallback: string, eType?: EEventTypes): boolean;
		connect(pReciever: any, fnCallback: T, eType?: EEventTypes): boolean;
		connect(pReciever: any, fnCallback: string, eType?: EEventTypes): boolean;

		disconnect(pSignal: ISignal<any>): boolean;
		disconnect(fnCallback: T, eType?: EEventTypes): boolean;
		disconnect(fnCallback: string, eType?: EEventTypes): boolean;
		disconnect(pReciever: any, fnCallback: T, eType?: EEventTypes): boolean;
		disconnect(pReciever: any, fnCallback: string, eType?: EEventTypes): boolean;

		emit(...args: any[]);
		clear(): void;
		hasListeners(): boolean;
		getSender(): any;
		getType(): EEventTypes;
		setForerunner(fn: Function): void;
	}

	export interface IListener<T extends Function> {
		reciever: any;
		callback: T;
		callbackName?: string;
		type: EEventTypes;
	}
	
	export interface IEventProvider extends IUnique {
		/**
		 * Special function which should be defined and redefined signals.
		 * Must be defined immediately after the constructor.
		 * Must be called immediately after the super() call in costructor or
		 * called first.
		 */
		//FIXME: will be removed from interface.
		setupSignals(): void;
	}
}
