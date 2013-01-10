#ifndef ENGINE_TS
#define ENGINE_TS

#include "IEngine.ts"
#include "ISceneManager.ts"
#include "IParticleManager.ts"
#include "IResourcePoolManager.ts"
#include "IRenderer.ts"
#include "IUtilTimer.ts"

#include "pool/ResourcePoolManager.ts"
#include "scene/SceneManager.ts"
#include "util/UtilTimer.ts"

#ifdef WEBGL
#include "webgl/WebGLRenderer.ts"
#endif

module akra.core {
	export class Engine implements IEngine {

		private _pResourceManager: IResourcePoolManager;
		private _pSceneManager: ISceneManager;
		private _pParticleManager: IParticleManager;
		private _pRenderer: IRenderer;

		/** stop render loop?*/
		private _pTimer: IUtilTimer;
		private _iAppPausedCount: int = 0;


		/** is paused? */
		private _isActive: bool = false;
		/** frame rendering sync / render next frame? */
		private _isFrameMoving: bool = true;
		/** render only one frame */
		private _isSingleStep: bool = true;



		constructor () {
			this._pResourceManager = new pool.ResourcePoolManager(this);
			this._pSceneManager = new scene.SceneManager(this);
			this._pParticleManager = null;

#ifdef WEBGL
			this._pRenderer = new webgl.WebGLRenderer(this);
#else
			CRITICAL("render system not specified");
#endif


			if (!this._pResourceManager.initialize()) {
				debug_error('cannot initialize ResourcePoolManager');
			}

			if (!this._pSceneManager.initialize()) {
				debug_error("cannot initialize SceneManager");
			}

			this._pTimer = util.UtilTimer.start();
			this.pause(false);
		}

		getSceneManager(): ISceneManager {
			return this._pSceneManager;
		}

		getParticleManager(): IParticleManager {
			return null;
		}

		getResourceManager(): IResourcePoolManager {
			return null;
		}

		getRenderer(): IRenderer {
			return this._pRenderer;
		}
	
		inline isActive(): bool {
			return this._isActive;
		}

		exec(bValue: bool = true): void {
			var pRenderer: IRenderer = this._pRenderer;
			var pEngine: IEngine = this;
			// var pCanvas: HTMLCanvasElement = null;

#if WEBGL
			// pCanvas = (<IWebGLRenderer>pRenderer).getHTMLCanvas();
#endif			

			ASSERT(!isNull(pRenderer));

	        pRenderer._initRenderTargets();

	        // Infinite loop, until broken out of by frame listeners
	        // or break out by calling queueEndRendering()
	        this._isActive = bValue;

	        function render(iTime: uint): void { 
#ifdef DEBUG
				if (pRenderer.isValid()) {
					ERROR(pRenderer.getError());
				}
#endif
	        	if (!pEngine.isActive()) {
	                return;
	            }

	            if (!pEngine.renderFrame()) {
	                debug_error("Engine::exec() error.");
	                return;
	            }

	            requestAnimationFrame(render/*, pCanvas*/); 
	        } 

	        render(0);
		}

		inline getTimer(): IUtilTimer { return this._pTimer; }

		renderFrame(): bool {
		    var fElapsedAppTime: float 	= this._pTimer.elapsedTime;

		    if (0. == fElapsedAppTime && this._isFrameMoving) {
		        return true;
		    }

		    // FrameMove (animate) the scene
		    if (this._isFrameMoving || this._isSingleStep) {

		    	this.frameStarted();

		        // Render the scene as normal
			    this._pRenderer._updateAllRenderTargets();

			    this.frameEnded();

		        this._isSingleStep = false;
		    }

			return true;
		}

		play(): bool {
			if (!this._isActive) { 
				this._iAppPausedCount = 0;
				this._isActive = true;

				if (this._isFrameMoving) {
		            this._pTimer.start();
		        }
	        }

	        return this._isActive;
		}

		pause(isPause: bool = false): bool {
			this._iAppPausedCount += ( isPause ? +1 : -1 );
		    this._isActive = ( this._iAppPausedCount ? false : true );

		    // Handle the first pause request (of many, nestable pause requests)
		    if (isPause && ( 1 == this._iAppPausedCount )) {
		        // Stop the scene from animating
		        if (this._isFrameMoving) {
		            this._pTimer.stop();
		        }
		    }

		    if (0 == this._iAppPausedCount) {
		        // Restart the timers
		        if (this._isFrameMoving) {
		            this._pTimer.start();
		        }
		    }

		    return !this._isActive;
		}


		BEGIN_EVENT_TABLE(Engine);
			BROADCAST(frameStarted, VOID);
			BROADCAST(frameEnded, VOID);
		END_EVENT_TABLE();

	}

}

module akra {
	createEngine = function (): IEngine {
		return new core.Engine();
	}
}

/*
		private initDefaultStates(): bool {
			this.pRenderState = {
		        mesh            : {
		            isSkinning : false
		        },
		        isAdvancedIndex : false,
		        lights          : {
		            omni : 0,
		            project : 0,
		            omniShadows : 0,
		            projectShadows : 0
		        }
		    };

			return true;
		}
 */

#endif