#ifndef IDEPSMANAGER_TS
#define IDEPSMANAGER_TS

#include "IEventProvider.ts"

module akra {
    export interface IDep {
        path: string;
        name?: string;
    }

	export interface IDependens {
        files?: IDep[];
        deps?: IDependens;
        root?: string;
        type?: string;
        loader?: (dep: IDependens, ...data: any[]) => void;
    }

    export interface IDepsManager extends IEventProvider {
    	load(pDeps: IDependens, sRoot?: string): bool;
    }
}

#endif