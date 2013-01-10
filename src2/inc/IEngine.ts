#ifndef IENGINE_TS
#define IENGINE_TS

module akra {
	
	IFACE(ISceneManager);
	IFACE(IParticleManager);
	IFACE(IResourcePoolManager);
    IFACE(IRenderer);
	IFACE(IUtilTimer);

    export interface IEngine extends IEventProvider {
        getSceneManager(): ISceneManager;
        getParticleManager(): IParticleManager;
        getResourceManager(): IResourcePoolManager;

        getRenderer(): IRenderer;

        pause(): bool;
        play(): bool;
        
        /** Render one frame. */
        renderFrame(): bool;
        
        /** Start exucution(rendering loop). */
        exec(): void;
        /** Определяет, находитсяли Engine в цикле рендеринга */
        isActive(): bool;

        getTimer(): IUtilTimer;
    };

    export var createEngine: () => IEngine;
}


#endif