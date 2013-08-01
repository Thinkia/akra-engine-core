///<reference path="../../../bin/DEBUG/akra.ts"/>
///<reference path="../../../bin/DEBUG/Progress.ts"/>

declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;

#define int number
#define uint number
#define float number
#define double number
#define long number

#define vec2(...) Vec2.stackCeil.set(__VA_ARGS__)
#define vec3(...) Vec3.stackCeil.set(__VA_ARGS__)
#define vec4(...) Vec4.stackCeil.set(__VA_ARGS__)
#define quat4(...) Quat4.stackCeil.set(__VA_ARGS__)
#define mat3(...) Mat3.stackCeil.set(__VA_ARGS__)
#define mat4(...) Mat4.stackCeil.set(__VA_ARGS__)

#define DEBUG_TERRAIN 1

module akra {

	#include "IGameTrigger.ts"
	#include "IGameTimeParameters.ts"
	#include "IGamePadParameters.ts"
	#include "IGameHeroParameters.ts"
	#include "IGameCameraParameters.ts"
	#include "IGameTriggersParamerers.ts"
	#include "IGameControls.ts"

	export interface IGameParameters extends 
		IGameTimeParameters, 
		IGamePadParameters, 
		IGameHeroParameters, 
		IGameCameraParameters, 
		IGameTriggersParamerers {
	}
	
	#include "setup.ts"
	#include "createProgress.ts"
	#include "createCameras.ts"
	#include "createSceneEnvironment.ts"
	#include "createViewports.ts"
	#include "createTerrain.ts"
	#include "createSkyBox.ts"
	#include "createSky.ts"
	#include "createModelEntry.ts"
	#include "createModelEx.ts"
	#include "putOnTerrain.ts"
	#include "fetchAllCameras.ts"

	#include "updateKeyboardControls.ts"
	#include "updateCamera.ts"

	var pProgress: IProgress = createProgress();
	var pGameDeps: IDependens = {
		files: [
			{path: "textures/terrain/main_height_map_1025.dds", name: "TERRAIN_HEIGHT_MAP"},
			{path: "textures/terrain/main_terrain_normal_map.dds", name: "TERRAIN_NORMAL_MAP"},
			{path: "textures/skyboxes/desert-3.dds", name: "SKYBOX"}
		],
		deps: {
			files: [
				{path: "models/barrel/barrel_and_support.dae", name: "BARREL"},
				{path: "models/box/closed_box.dae", name: "CLOSED_BOX"},
				{path: "models/tube/tube.dae", name: "TUBE"},
				{path: "models/tubing/tube_beeween_rocks.DAE", name: "TUBE_BETWEEN_ROCKS"},
				// {path: "models/hero/movie.dae", name: "HERO_MODEL"},
				{path: "models/character/character.dae", name: "CHARACTER_MODEL"},
			],
			deps: {
				files: [{path: "models/character/movement.json", name: "HERO_CONTROLLER"}]
			}
		}
	};

	var pRenderOpts: IRendererOptions = {
		//for screenshoting
		preserveDrawingBuffer: true,
		alpha: false,
	};

	
	var pControllerData: IDocument = null;
	var pLoader = {
		changed: (pManager: IDepsManager, pFile: IDep, pInfo: any): void => {
			var sText: string = "";

			if (pFile.status === EDependenceStatuses.LOADING) {
				sText += "Loading ";
			}
			else if (pFile.status === EDependenceStatuses.UNPACKING) {
				sText += "Unpacking ";
			}

			if (pFile.status === EDependenceStatuses.LOADING || pFile.status === EDependenceStatuses.UNPACKING) {
				sText += ("resource " + path.info(path.uri(pFile.path).path).basename);
				
				if (!isNull(pInfo)) {
					sText += " (" + (pInfo.loaded / pInfo.total * 100).toFixed(2) + "%)";
				}

				pProgress.drawText(sText);
			}
			else if (pFile.status === EDependenceStatuses.LOADED) {
				pProgress.total[pFile.deps.depth] = pFile.deps.total;
				pProgress.element = pFile.deps.loaded;
				pProgress.depth = pFile.deps.depth;
				pProgress.draw();

				if (pFile.name === "HERO_CONTROLLER") {
					pControllerData = pFile.content;	
				}
			}
		},
		loaded: (pManager: IDepsManager): void => {
			pProgress.cancel();
			document.body.removeChild(pProgress.canvas);
		}
	};

	var pOptions: IEngineOptions = {
		renderer: pRenderOpts,
		deps: pGameDeps,
		loader: pLoader
	};

	var pEngine: IEngine = createEngine(pOptions);
	
	
	var pUI: IUI 						= pEngine.getSceneManager().createUI();
	var pCanvas: ICanvas3d 				= pEngine.getRenderer().getDefaultCanvas();
	var pCamera: ICamera 				= null;
	var pViewport: IViewport 			= null;
	var pIDE: ui.IDE 					= null;
	var pSkyBoxTexture: ITexture 		= null;
	var pGamepads: IGamepadMap 			= pEngine.getGamepads();
	var pKeymap: controls.KeyMap		= <controls.KeyMap>controls.createKeymap();
	var pTerrain: ITerrain 				= null;
	var pSky: model.Sky  				= null;
	var pMovementController: IAnimationController = null;

	var pRmgr: IResourcePoolManager 	= pEngine.getResourceManager();
	var pScene: IScene3d 				= pEngine.getScene();

	export var self = {
		engine 				: pEngine,
		scene 				: pScene,
		camera 				: pCamera,
		viewport 			: pViewport,
		canvas 				: pCanvas,
		rsmgr 				: pRmgr,
		renderer 			: pEngine.getRenderer(),
		keymap 				: pKeymap,
		gamepads 			: pGamepads,
		// cameraTerrainProj 	: <ISceneModel>null,
		terrain 			: <ITerrain>null,
		cameras 			: <ICamera[]>[],
		activeCamera  		: 0,
		cameraLight 		: <ILightPoint>null,
		voice  				: <any>null,
		sky   				: <model.Sky>null,

		hero: {
			root: 	<ISceneNode>null,
			head: 	<ISceneNode>null,
			pelvis: <ISceneNode>null,

			camera: <ICamera>null,
			triggers: <IGameTrigger[]>[],
			controls: <IGameControls> {
		        direct  : {
		            x : 0,
		            y : 0
		        },

		        forward : false,
		        back    : false,
		        right   : false,
		        left    : false,
		        dodge   : false,
		        gun     : false,

		    },

			parameters: <IGameParameters>{
		        analogueButtonThreshold : 0.25,
		        time                    : 0,/*this.fTime*/
		        timeDelta               : 0.,

		        movementRate          : 0,
		        movementRateThreshold : 0.0001,
		        movementSpeedMax      : 9.0, /* sec */

		        rotationSpeedMax : 10, /* rad/sec*/
		        rotationRate     : 0, /* current speed*/

		        runSpeed           : 9.0, /* m/sec*/
		        walkToRunSpeed     : 2.5, /* m/sec*/
		        walkSpeed          : 1.5, /* m/sec*/
		        walWithWeaponSpeed    : 1.0, /* m/sec */
        		walWithoutWeaponSpeed : 1.5, /* m/sec */

		        movementDerivativeMax   : 1.0,
		        movementDerivativeMin   : 0.5,
		        movementDerivativeConst : (2 * (Math.E + 1) / (Math.E - 1) *
		                                    (1.0 - 0.5)), /*(fSpeedDerivativeMax - fSpeedDerivativeMin)*/

		        walkBackAngleRange : -0.85, /*rad*/

		        cameraPitchChaseSpeed : 10.0, /*rad/sec*/
		        cameraPitchSpeed      : 3.0,
		        cameraPitchMax        : -60.0 * math.RADIAN_RATIO,
		        cameraPitchMin        : +30.0 * math.RADIAN_RATIO, 
		        cameraPitchBase       : Math.PI / 10,


		        blocked     	: true,
		        lastTriggers 	: 1,

		        position: new Vec3(0.),
		        cameraCharacterDistanceBase       : 5.0, /*метров [расстояние на которое можно убежать от центра камеры]*/
		        cameraCharacterDistanceMax        : 15.0,
		        cameraCharacterChaseSpeed         : 25, /* m/sec*/
		        cameraCharacterChaseRotationSpeed : 5., /* rad/sec*/
		        cameraCharacterFocusPoint         : new Vec3(0.0, 0.5, 0.0), /*meter*/

		        state : EGameHeroStates.GUN_NOT_DRAWED,
		        fallDown: false,
		        fallTransSpeed: 0,
		        fallStartTime: 0,

		        anim: <any>{}
		    }
		}
	}

	pKeymap.captureMouse((<webgl.WebGLCanvas>pCanvas).el);
	pKeymap.captureKeyboard(document);

	//>>>>>>>>>>>>>>>>>>>>>
	function initState(pHeroNode: ISceneNode) {
		var pStat = self.hero.parameters;

	    function findAnimation(sName: string, sPseudo?: string): any {
	        pStat.anim[sPseudo || sName] = pHeroNode.getController().findAnimation(sName);
	        return pStat.anim[sPseudo || sName];
	    }

	    pStat.time = self.engine.time;
	    pStat.position.set(self.hero.root.worldPosition);

	    findAnimation("MOVEMENT.player");
	    findAnimation("MOVEMENT.blend");

		// findAnimation("RUN.player").stop();
		// findAnimation("WALK.player").stop();
		// findAnimation("WALKBACK.player").stop();

	    // findAnimation("MOVEMENT.player");
	    // findAnimation("MOVEMENT.blend");

	    findAnimation('STATE.player');
    	findAnimation('STATE.blend');

	    findAnimation("RUN.player"); 
    	findAnimation("WALK.player");

	    activateTrigger([moveHero, movementHero, checkHeroState]);
	}


	function updateCharacterCamera(pControls: IGameControls, pHero: ISceneNode, pStat: IGameParameters, pController: IAnimationController) {
	    var pCamera: ICamera = self.hero.camera;
	    var fTimeDelta: float = pStat.timeDelta;
	    var pGamepad: Gamepad = self.gamepads.find(0);

	    if (!pGamepad || !pCamera.isActive()) {
	        return;
	    }

	    var fX: float = -pGamepad.axes[EGamepadAxis.RIGHT_ANALOGUE_HOR];
	    var fY: float = -pGamepad.axes[EGamepadAxis.RIGHT_ANALOGUE_VERT];

	    if (math.abs(fX) < pStat.analogueButtonThreshold) {
	        fX = 0;
	    }

	    if (math.abs(fY) < pStat.analogueButtonThreshold) {
	        fY = 0;
	    }

	    // var pCameraWorldData: Float32Array = pCamera.worldMatrix.data;

	    var v3fHeroFocusPoint: IVec3 = pStat.cameraCharacterFocusPoint.add(self.hero.pelvis.worldPosition, vec3());
	   	var v3fCameraHeroDist: IVec3;
	    

	    // camera orientation
	    
	   	var v3fCameraYPR: IVec3 = pCamera.localOrientation.toYawPitchRoll(vec3());
	    var fPitchRotation: float = 0;
	    var qPitchRot: IQuat4;
	    var fYawRotation: float = 0;
	    var qYawRot: IQuat4;


	    /* 
	       Pitch
	             | -90(-PI/2)
	    	 0   |
	       --|-- +
	    	/ \  |
                 | +90(+PI/2)
	     */
	    
	    // console.log(pStat.cameraPitchMax * math.DEGREE_RATIO, "<", v3fCameraYPR.y * math.DEGREE_RATIO, "<", pStat.cameraPitchMin * math.DEGREE_RATIO, fY, (v3fCameraYPR.y > pStat.cameraPitchMax && fY > 0));
		
		if ((v3fCameraYPR.y > pStat.cameraPitchMax && fY > 0) ||
	        (v3fCameraYPR.y < pStat.cameraPitchMin && fY < 0)) 
	 	{
			fPitchRotation = fY * pStat.cameraPitchSpeed * fTimeDelta;
	 		
		    var pCameraWorldData: Float32Array = pCamera.worldMatrix.data;
		    var v3fCameraDir: IVec3 = vec3(-pCameraWorldData[__13], 0, -pCameraWorldData[__33]).normalize();
		    var v3fCameraOrtho: IVec3 = vec3(v3fCameraDir.z, 0, -v3fCameraDir.x);
		    qPitchRot = Quat4.fromAxisAngle(v3fCameraOrtho, fPitchRotation, quat4());
	    
	        v3fCameraHeroDist = pCamera.worldPosition.subtract(v3fHeroFocusPoint, vec3());
		    pCamera.localPosition = qPitchRot.multiplyVec3(v3fCameraHeroDist, vec3()).add(v3fHeroFocusPoint);
		    pCamera.update();

	        // pCamera.localPosition.scale(1. + fY / 25);
	        pCamera.update();
	    }
	    
	   	fYawRotation = fX * pStat.cameraPitchChaseSpeed * fTimeDelta;
	    qYawRot = Quat4.fromYawPitchRoll(fYawRotation, 0, 0., quat4());
	   

	    v3fCameraHeroDist = pCamera.worldPosition.subtract(v3fHeroFocusPoint, vec3());
	    pCamera.localPosition = qYawRot.multiplyVec3(v3fCameraHeroDist, vec3()).add(v3fHeroFocusPoint);
	    pCamera.update();

	     //camera position
	    var fCharChaseSpeedDelta: float = (pStat.cameraCharacterChaseSpeed * fTimeDelta);
	    
	    var fCameraHeroDist: float = v3fCameraHeroDist.length();
	    var fDist: float = 
	    (fCameraHeroDist - pStat.cameraCharacterDistanceBase) / pStat.cameraCharacterDistanceMax * fCharChaseSpeedDelta;

	    var v3fHeroZX: IVec3 = vec3(v3fHeroFocusPoint);
	    v3fHeroZX.y = 0.0;
	    
	    var v3fCameraZX: IVec3 = vec3(pCamera.worldPosition);
	    v3fCameraZX.y = 0.0;

	    //направление в плоскости XZ от камеры к персонажу(фокус поинту)
	    var v3fHorDist: IVec3 = v3fHeroZX.subtract(v3fCameraZX, vec3());
	    var v3fDir: IVec3 = v3fHorDist.normalize(vec3());
	    
	    if (v3fHorDist.length() > 2.0 || fDist <= 0) {
			pCamera.addPosition(v3fDir.scale(fDist));
		}

		//настигаем нужную высоту
		var fDeltaHeight: float = (v3fHeroFocusPoint.y + math.sin(pStat.cameraPitchBase) * fCameraHeroDist - pCamera.worldPosition.y);
		pCamera.addPosition(vec3(0., (fDeltaHeight * fCharChaseSpeedDelta * math.abs(fDeltaHeight / 100)), 0.));
		    
		pCamera.update();


	    if (!isNull(pTerrain)) {
	    	var v3fDt: IVec3 = vec3(0.);

    		pTerrain.projectPoint(pCamera.worldPosition, v3fDt);
    		
    		v3fDt.x = pCamera.worldPosition.x;
    		v3fDt.y = math.max(v3fDt.y + 1.0, pCamera.worldPosition.y);
    		v3fDt.z = pCamera.worldPosition.z;

    		pCamera.setPosition(v3fDt);
    	}

		// pCamera.update();

	    //camera orientation
 
	    var qCamera: IQuat4 = Quat4.fromYawPitchRoll(v3fCameraYPR.x + fYawRotation, v3fCameraYPR.y/* + fPitchRotation*/, v3fCameraYPR.z);
	    var qHeroView: IQuat4 = Mat4.lookAt(pCamera.worldPosition, 
	    							v3fHeroFocusPoint, 
	    							vec3(0., 1., 0.),
	                                mat4()).toQuat4(quat4());

	    qCamera.smix(qHeroView.conjugate(), pStat.cameraCharacterChaseRotationSpeed * fTimeDelta);

	    pCamera.localOrientation = qCamera;
	    pCamera.update();
	    //====================
	    

	    //pStat.cameraPitchChaseSpeed
	    //-pStat.cameraPitchBase
	    //-pStat.cameraPitchMin
	    //-pStat.cameraPitchMax
	    //pStat.cameraPitchSpeed

	    
	}

	function movementHero(pControls: IGameParameters, pHero: ISceneNode, pStat: IGameParameters, pController: IAnimationController) {
	    var pAnim: IAnimationMap = pStat.anim;

	    var fMovementRate: float = pStat.movementRate;
	    var fMovementRateAbs: float = math.abs(fMovementRate);

	    var fRunSpeed: float = pStat.runSpeed;
	    var fWalkSpeed: float = pStat.walkSpeed;
	    var fWalkToRunSpeed: float = pStat.walkToRunSpeed;

	    var fSpeed: float;

	    var fRunWeight: float;
	    var fWalkWeight: float;

	    //pStat.movementSpeedMax = pStat.state? pStat.walkToRunSpeed: pStat.runSpeed;


        pStat.walkSpeed = pStat.walWithoutWeaponSpeed;
        pStat.movementSpeedMax = pStat.runSpeed;


	    fSpeed = fMovementRateAbs * pStat.movementSpeedMax;

	    if (pController.active) {

		    if (pController.active.name !== "STATE.player") {
		        // pController.play('STATE.player', this.fTime);
		    }
	    }
	    else {
	    	console.warn("controller::active is null ;(");
	    }

	    //character move
	    if (fSpeed > fWalkSpeed) {
	        // if ((<IAnimationContainer>pAnim["MOVEMENT.player"]).isPaused()) {
	        //     (<IAnimationContainer>pAnim["MOVEMENT.player"]).pause(false);
	        // }

	        if (fMovementRate > 0.0) {
	            //run forward
	            if (fSpeed < pStat.walkToRunSpeed) {

	                if (pStat.state) {
	                	//walk with gun
	                    (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(0., 0., 0., 1.); /*only walk*/
	                }
	                else {
	                    (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(0., 1., 0.); /* only walk */
	                }

	                (<IAnimationContainer>pAnim["WALK.player"]).setSpeed(fSpeed / fWalkSpeed);
	                console.log("walk speed: ", fSpeed / fWalkSpeed);
	            }	
	            else {
	                fRunWeight = (fSpeed - fWalkToRunSpeed) / (fRunSpeed - fWalkToRunSpeed);
	                fWalkWeight = 1. - fRunWeight;
	                //run //walk frw //walk back
	                if (pStat.state) {
	                	//with gun
	                    (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(fRunWeight, 0., 0., fWalkWeight);
	                }
	                else {
	                    (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(fRunWeight, fWalkWeight, 0.);
	                }

	                console.log("run weight:", fRunWeight, "walk weight:", fWalkWeight);
	                (<IAnimationContainer>pAnim["MOVEMENT.player"]).setSpeed(1.);
	            }
	        }
	        else {
	            //run //walk frw //walk back
	            (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(0., 0., 1.);
	            (<IAnimationContainer>pAnim["MOVEMENT.player"]).setSpeed(fMovementRateAbs);

	            pStat.movementSpeedMax = fWalkSpeed;
	        }

	        //дабы быть уверенными что IDLE не считается
	        // pAnim["STATE.blend"].setAnimationWeight(0, 0.); /* idle */
	        // pAnim["STATE.blend"].setAnimationWeight(2, 0.); /* gun */
	    }
	    //character IDLE
	    else {
	        var iIDLE: int = pStat.state ? 2 : 0.;
	        var iMOVEMENT: int = 2;

	        // (<IAnimationContainer>pAnim["MOVEMENT.player"]).pause(true);

	        if (pStat.state == EGameHeroStates.GUN_NOT_DRAWED || pStat.state >= EGameHeroStates.GUN_IDLE) {
	            (<IAnimationBlend>pAnim["STATE.blend"]).setWeightSwitching(fSpeed / fWalkSpeed, iIDLE, iMOVEMENT); /* idle ---> run */
	        }

	        // trace(pAnim["STATE.blend"].getAnimationWeight(0), pAnim["STATE.blend"].getAnimationWeight(1), pAnim["STATE.blend"].getAnimationWeight(2))

	        if (fMovementRate > 0.0) {
	            //walk forward --> idle
	            if (pStat.state) {
	            	//with gun
	                (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(null, 0., 0., fSpeed / fWalkSpeed);
	            }
	            else {
	                (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(null, fSpeed / fWalkSpeed, 0.);
	            }
	        }
	        else if (fMovementRate < 0.0) {
	            //walk back --> idle
	            (<IAnimationBlend>pAnim["MOVEMENT.blend"]).setWeights(null, 0, fSpeed / fWalkSpeed);
	        }

	        (<IAnimationContainer>pAnim["MOVEMENT.player"]).setSpeed(1);
	    }

	    // if (pController.dodge) {
	    //     this.activateTrigger([this.dodgeHero, this.moveHero]);
	    // }
	}

	function checkHeroState(pControls, pHero, pStat, pController) {
	    // if (pControls.gun) {
	    //     this.activateTrigger([this.gunWeaponHero, this.moveHero]);
	    // }
	}


	inline function isFirstFrameOfTrigger(): bool {
	    return self.hero.parameters.lastTriggers !== self.hero.triggers.length;
	};

	function moveHero(pControls: IGameControls, pHero: ISceneNode, pStat: IGameParameters, pController: IAnimationController): void {
	    var fMovementRate: float;
	    var fMovementSpeedMax: float;

	    var fTimeDelta: float;
	    var fDirectX: float, fDirectY: float;
	    var fMovementDerivative: float;
	    var fMovementDerivativeMax: float;
	    var fRotationRate: float = 0;

	    var fMovementRateAbs: float;
	    var fWalkRate: float;
	    var f: float;

	    var pCamera: ICamera, pCameraWorldData: Float32Array;
	    var v3fCameraDir: IVec3, v3fCameraOrtho: IVec3;
	    var fCameraYaw: float;

	    var pHeroWorldData: Float32Array;
	    var v3fHeroDir: IVec3;

	    var v2fStick: IVec2;
	    var fScalar: float;
	    var fPower: float;
	    var v2fStickDir: IVec2;

	    var v3fRealDir: IVec3;

	    var fMovementDot: float;
	    var fMovementTest: float;
	    var fMovementDir: float;

	    //analogue stick values
	    fDirectY = pControls.direct.y;
	    fDirectX = -pControls.direct.x;

	    //camera data
	    pCamera = self.hero.camera;
	    pCameraWorldData = pCamera.worldMatrix.data;

	    //camera view direction projection to XZ axis
	    v3fCameraDir = vec3(-pCameraWorldData[__13], 0., -pCameraWorldData[__33]).normalize();
	    //v3fCameraOrtho  = Vec3(v3fCameraDir.z, 0., -v3fCameraDir.x);

	    //hero directiob proj to XZ axis
	    pHeroWorldData = pHero.worldMatrix.data;
	    v3fHeroDir = vec3(pHeroWorldData[__13], 0., pHeroWorldData[__33]).normalize();

	    //stick data
	    v2fStick = vec2(fDirectX, fDirectY);

	    //calculating stick power
	    if (v2fStick.x == v2fStick.y && v2fStick.x == 0.) {
	        fScalar = 0.;
	    }
	    else if (math.abs(v2fStick.x) > math.abs(v2fStick.y)) {
	        fScalar = math.sqrt(1. + math.pow(v2fStick.y / v2fStick.x, 2.));
	    }
	    else {
	        fScalar = math.sqrt(math.pow(v2fStick.x / v2fStick.y, 2.) + 1.);
	    }

	    //stick power value
	    fPower = fScalar ? v2fStick.length() / fScalar : 0.;
	    //stick dir
	    v2fStickDir = v2fStick.normalize(vec2());

	    //camera yaw
	    fCameraYaw = -math.atan2(v3fCameraDir.z, v3fCameraDir.x);

	    //real direction in hero-space
	    v3fRealDir = vec3(v2fStickDir.y, 0., v2fStickDir.x);
	    Quat4.fromYawPitchRoll(fCameraYaw, 0., 0., quat4()).multiplyVec3(v3fRealDir);


	    //movement parameters
	    fMovementDot = v3fRealDir.dot(v3fHeroDir);
	    fMovementTest = math.abs(fMovementDot - 1.) / 2.;
	    fMovementDir = 1.;

	    fMovementRate = fPower * math.sign(fMovementDot);

	    if (fMovementDot > pStat.walkBackAngleRange) {
	        fMovementDir = v3fRealDir.x * v3fHeroDir.z - v3fRealDir.z * v3fHeroDir.x;
	        fRotationRate = fPower * math.sign(fMovementDir) * fMovementTest;
	    }
	    else {
	        fRotationRate = 0.0;
	    }

	    fTimeDelta = pEngine.time - pStat.time;
	    fMovementSpeedMax = pStat.movementSpeedMax;
	    fWalkRate = pStat.walkSpeed / pStat.movementSpeedMax;

	    if (fTimeDelta != 0.0) {
	        fMovementDerivative = (fMovementRate - pStat.movementRate) / fTimeDelta;
	        f = math.exp(math.abs(pStat.movementRate));
	        fMovementDerivativeMax = pStat.movementDerivativeMin + ((f - 1.) / (f + 1.)) * pStat.movementDerivativeConst;
	        fMovementRate = pStat.movementRate +
	                        fTimeDelta * math.clamp(fMovementDerivative, -fMovementDerivativeMax, fMovementDerivativeMax);
	    }

	    fMovementRateAbs = math.abs(fMovementRate);

	    if (fMovementRateAbs < pStat.movementRateThreshold) {
	        fMovementRate = 0.;

	        // this.pCurrentSpeedField.edit("0.00 m/sec");
	    }

	    if (fRotationRate != 0.) {
	        pHero.addRelRotationByEulerAngles(fRotationRate * pStat.rotationSpeedMax * fTimeDelta, 0.0, 0.0);
	    }
	    // var _p = vec3(pHero.worldPosition);

	    if (pStat.fallDown || fMovementRateAbs >= fWalkRate ||
	        (fMovementRate < 0. && fMovementRateAbs > pStat.walkSpeed / pStat.runSpeed)) {

	    	//projection of the hero on the terrin
	    	var v3fHeroTerrainProjPoint: IVec3 = vec3(0.);
	    	//prev. hero position
	    	var v3fHeroPos: IVec3 = vec3(pHero.worldPosition);

	    	var fMovementSpeed: float = fMovementRate * fMovementSpeedMax;

	    	if (pStat.fallDown) {
	    		fMovementSpeed = pStat.fallTransSpeed;
	    	}

	    	//hero orinted along Z-axis
	    	pHero.addRelPosition(vec3(0.0, 0.0, fMovementSpeed * fTimeDelta));
	    	pHero.update();

	    	if (!isNull(pTerrain)) {
	    		pTerrain.projectPoint(pHero.worldPosition, v3fHeroTerrainProjPoint);

	    		if (v3fHeroPos.y - v3fHeroTerrainProjPoint.y > 0.1) {
	    			
	    			if (pStat.fallDown == false) {
		    			pStat.fallDown = true;
		    			pStat.fallTransSpeed = fMovementSpeed;
		    			pStat.fallStartTime = now();
	    			}

	    			var fFallSpeed: float = ((now() - pStat.fallStartTime) / 1000) * math.GRAVITY_CONSTANT;
	    			pHero.setPosition(pHero.worldPosition.x, pHero.worldPosition.y - fFallSpeed * fTimeDelta, pHero.worldPosition.z);
	    		}
	    		else {
	    			pStat.fallDown = false;
	    			pHero.setPosition(v3fHeroTerrainProjPoint);
	    		}
	    	}

	        // this.pCurrentSpeedField.edit((fMovementRate * fMovementSpeedMax).toFixed(2) + " m/sec");
	    }
	    // pHero.setPosition(_p);
	    pStat.rotationRate = fRotationRate;
	    pStat.movementRate = fMovementRate;
	    pStat.time = pEngine.time;
	    pStat.timeDelta = fTimeDelta;
	};

	function activateTrigger(pTriggersList: Function[]): void {
	    pTriggersList.push(updateCharacterCamera);
	    self.hero.triggers.push({triggers : pTriggersList, time : pEngine.time});
	};

	function deactivateTrigger(): IGameTrigger {
	    return self.hero.triggers.pop();
	};

	function updateHero (): void {
	    var pGamepad: Gamepad = self.gamepads.find(0);
	    var pHero: ISceneNode = self.hero.root;
	    var pStat: IGameParameters = self.hero.parameters;
	    var pController: IAnimationController = self.hero.root.getController();
	    
	    var pTriggers: IGameTrigger	  = self.hero.triggers.last;
	    var pControls: IGameControls  = self.hero.controls;
	    var pTriggersData: Function[] = pTriggers.triggers;

	    if (!pGamepad) {
	        return;
	    }
	    if (pGamepad.buttons[EGamepadCodes.SELECT]) {
	        pStat.blocked = true;
	    }
	    if (pGamepad.buttons[EGamepadCodes.START]) {
	        pStat.blocked = false;
	    }
	    if (pStat.blocked) {
	        return;
	    }

	    var fDirectY: float = -pGamepad.axes[EGamepadAxis.LEFT_ANALOGUE_VERT];
	    var fDirectX: float = -pGamepad.axes[EGamepadAxis.LEFT_ANALOGUE_HOR];

	    var fAnalogueButtonThresholdInv: float = 1. - pStat.analogueButtonThreshold;

	    if (math.abs(fDirectX) < pStat.analogueButtonThreshold) {
	        fDirectX = 0.;
	    }
	    else {
	        fDirectX = math.sign(fDirectX) * (math.abs(fDirectX) - pStat.analogueButtonThreshold) /
	                   fAnalogueButtonThresholdInv;
	    }
	    if (math.abs(fDirectY) < pStat.analogueButtonThreshold) {
	        fDirectY = 0.;
	    }
	    else {
	        fDirectY = math.sign(fDirectY) * (math.abs(fDirectY) - pStat.analogueButtonThreshold) /
	                   fAnalogueButtonThresholdInv;
	    }

	    pControls.direct.y = fDirectY;
	    pControls.direct.x = fDirectX;

	    pControls.forward = !!pGamepad.buttons[EGamepadCodes.PAD_TOP];
	    pControls.back = !!pGamepad.buttons[EGamepadCodes.PAD_BOTTOM];
	    pControls.left = !!pGamepad.buttons[EGamepadCodes.PAD_LEFT];
	    pControls.right = !!pGamepad.buttons[EGamepadCodes.PAD_RIGHT];

	    pControls.dodge = !!pGamepad.buttons[EGamepadCodes.FACE_1];
	    pControls.gun = !!pGamepad.buttons[EGamepadCodes.FACE_4];

	    var iTrigger: uint = self.hero.triggers.length;

	    for (var i: int = 0; i < pTriggersData.length; ++i) {
	        pTriggersData[i](pControls, pHero, pStat, pController, pTriggers.time);
	    }

	    pStat.lastTriggers = iTrigger;
	}

	function updateCameraAxes(): void {
	    // var pCameraWorldData = this.getActiveCamera().worldMatrix().pData;
	    // var v3fCameraDir = Vec3(-pCameraWorldData._13, 0, -pCameraWorldData._33).normalize();

	    // this.pCameraBasis.setRotation(Vec3(0, 1, 0), -Math.atan2(v3fCameraDir.z, v3fCameraDir.x));
	}

	function setupCameras(pHeroNode: ISceneNode): void {
		self.hero.root = pHeroNode;

		var pCharacterCamera: ICamera = pScene.createCamera("character-camera");
	    var pCharacterRoot: ISceneNode = self.hero.root;
	    var pCharacterPelvis: ISceneNode = <ISceneNode>pCharacterRoot.findEntity("node-Bip001");
	    var pCharacterHead: ISceneNode = <ISceneNode>pCharacterRoot.findEntity("node-Bip001_Head");

	    pCharacterCamera.setInheritance(ENodeInheritance.NONE);
	    pCharacterCamera.attachToParent(pCharacterRoot);
	    pCharacterCamera.setProjParams(Math.PI / 4.0, pCanvas.width / pCanvas.height, 0.1, 3000.0);
	    pCharacterCamera.setRelPosition(vec3(0, 2.5, -5));

	    self.hero.camera = pCharacterCamera;
	    self.hero.head = pCharacterHead;
	    self.hero.pelvis = pCharacterPelvis;
	}

	//>>>>>>>>>>>>>>>>>>>>>

	function isDefaultCamera(pViewport: IViewport, pKeymap: IKeyMap, pCamera: ICamera, pCharacterCamera: ICamera, pGamepad: Gamepad): bool {

		if (pKeymap.isKeyPress(EKeyCodes.N1) ||
	        (pGamepad && pGamepad.buttons[EGamepadCodes.RIGHT_SHOULDER])) {
	        pCharacterCamera.lookAt(self.hero.head.worldPosition);
	        pViewport.setCamera(pCharacterCamera);
	    }
	    else if (pKeymap.isKeyPress(EKeyCodes.N2) ||
	             (pGamepad && pGamepad.buttons[EGamepadCodes.LEFT_SHOULDER])) {
	        pViewport.setCamera(pCamera);
	    }

	    if (pCharacterCamera.isActive()) {
	        return false;
	    }

	    return true;
	}


	function update(): void {
		var pCharacterCamera: ICamera = self.hero.camera;
		var pGamepad: Gamepad = pGamepads.find(0);

		if (isDefaultCamera(pViewport, pKeymap, pCamera, pCharacterCamera, pGamepad)) {
			updateCamera(pCamera, pKeymap, pGamepad);
		}

		updateHero();
		self.keymap.update();
	}

	function createModels(): void {
		var pImporter = new io.Importer(pEngine);
		pImporter.loadDocument(pControllerData);
		pMovementController = pImporter.getController();

		var pHeroNode: ISceneNode = <ISceneNode>createModelEx("CHARACTER_MODEL", pScene, pTerrain, pCamera, pMovementController);
		setupCameras(pHeroNode);
		initState(pHeroNode);

		var pBox: ISceneNode = createModelEntry(pScene, "CLOSED_BOX");

		pBox.scale(.25);
		putOnTerrain(pBox, pTerrain, new Vec3(-2., -3.85, -5.));
		pBox.addPosition(new Vec3(0., 1., 0.));

		var pBarrel: ISceneNode = createModelEntry(pScene, "BARREL");

		pBarrel.scale(.75);
		pBarrel.setPosition(new Vec3(-30., -40.23, -15.00));
		pBarrel.setRotationByXYZAxis(-17. * math.RADIAN_RATIO, -8. * math.RADIAN_RATIO, -15. * math.RADIAN_RATIO);
		

		var pTube: ISceneNode = createModelEntry(pScene, "TUBE");

		pTube.scale(19.);
		pTube.setRotationByXYZAxis(0. * math.RADIAN_RATIO, -55. * math.RADIAN_RATIO, 0.);
		pTube.setPosition(new Vec3(-16.  , -52.17  ,-66.));
		

		var pTubeBetweenRocks: ISceneNode = createModelEntry(pScene, "TUBE_BETWEEN_ROCKS");
	
		pTubeBetweenRocks.scale(2.);
		pTubeBetweenRocks.setRotationByXYZAxis(5. * math.RADIAN_RATIO, 100. * math.RADIAN_RATIO, 0.);
		pTubeBetweenRocks.setPosition(new Vec3(-55., -12.15, -82.00));
		
		

		pScene.bind("beforeUpdate", update);
		
		self.cameras = fetchAllCameras(pScene);
		self.activeCamera = self.cameras.indexOf(self.camera);
	}

	function main(pEngine: IEngine): void {
		setup(pCanvas, pUI);

		pCamera 		= self.camera 	= createCameras(pScene);
		pViewport 						= createViewports(pCamera, pCanvas, pUI);
		pTerrain 		= self.terrain 	= createTerrain(pScene);
										  createModels();
		pSkyBoxTexture 					= createSkyBox(pRmgr, <IDSViewport>pViewport);
		pSky 			= self.sky 		= createSky(pScene, 14.0);

		pKeymap.bind("equalsign", () => {
			self.activeCamera ++;
	    	
	    	if (self.activeCamera === self.cameras.length) {
	    		self.activeCamera = 0;
	    	}

	    	var pCam: ICamera = self.cameras[self.activeCamera];
	    	
	    	pViewport.setCamera(pCam);
		});


		createSceneEnvironment(pScene, true, true);
#if DEBUG_TERRAIN == 1
		pEngine.getComposer()["bShowTriangles"] = true;
		if (pTerrain.megaTexture)
			pTerrain.megaTexture["_bColored"] = true;
#endif
		pEngine.exec();
	}

	pEngine.bind("depsLoaded", main);	
}

