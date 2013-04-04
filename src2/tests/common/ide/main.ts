#include "util/testutils.ts"
#include "akra.ts"
#include "IDE.ts"

module akra {
	export var pEngine: IEngine = createEngine();
	var pRmgr: IResourcePoolManager = pEngine.getResourceManager();
	var pScene: IScene3d = pEngine.getScene();
	var pUI: IUI = pEngine.getSceneManager().createUI();
	var pCanvas: ICanvas3d = pEngine.getRenderer().getDefaultCanvas();
	var pCamera: ICamera = null;
	var pViewport: IViewport = null;
	var pIDE: IUIComponent = null;

	function setup(): void {
		pIDE = pUI.createComponent("IDE");
		pIDE.render($(document.body));
	}

	function createCameras(): void {
		pCamera = pScene.createCamera();
	
		pCamera.addPosition(vec3(0,0, 10));
		pCamera.attachToParent(pScene.getRootNode());
	}

	function createViewports(): void {
		pViewport = pCanvas.addViewport(pCamera, EViewportTypes.DSVIEWPORT);
	}

	function createLighting(): void {
		var pOmniLight: ILightPoint = pScene.createLightPoint(ELightTypes.OMNI, false, 0, "test-omni");
		
		pOmniLight.attachToParent(pScene.getRootNode());
		pOmniLight.enabled = true;
		pOmniLight.params.ambient.set(0.1, 0.1, 0.1, 1);
		pOmniLight.params.diffuse.set(1);
		pOmniLight.params.specular.set(1, 1, 1, 1);
		pOmniLight.params.attenuation.set(1,0,0);

		pOmniLight.addPosition(0, 0, 5);
	}

	function loadModels(sPath, fnCallback?: Function): ISceneNode {
		var pController: IAnimationController = null;
		var pModelRoot: ISceneNode = pScene.createNode();
		var pModel: ICollada = <ICollada>pRmgr.loadModel(sPath);
		
		pController = animation.createController();

		pModelRoot.attachToParent(pScene.getRootNode());
		pModelRoot.scale(2.);
		pModelRoot.addPosition(0, -1., 0);

		pModel.bind(SIGNAL(loaded), (pModel: ICollada) => {
			pModel.attachToScene(pModelRoot, pController);

			pController.attach(pModelRoot);

			var pContainer: IAnimationContainer = animation.createContainer();

			if (pController.active) {
				pContainer.setAnimation(pController.active);
				pContainer.useLoop(true);
				pController.addAnimation(pContainer);		
			}


			pScene.bind(SIGNAL(beforeUpdate), () => {
				pModelRoot.addRelRotationByXYZAxis(0.00, 0.01, 0);
				pController.update(pEngine.time);
			});

			if (isFunction(fnCallback)) {
				fnCallback(pModelRoot);
			}
		});

		return pModelRoot;
	}

	function main(pEngine: IEngine): void {
		setup();
		createCameras();
		createViewports();
		createLighting();
		
		// loadModels("../../../data/models/Weldinggun.dae");
		// loadModels("../../../data/models/kr360.dae");
		loadModels("../../../data/models/hero/hero.DAE");
		loadModels("../../../data/models/WoodSoldier/WoodSoldier.DAE");
		loadModels("../../../data/models/teapot.dae", (pModel: ISceneNode) => { pModel.scale(.01); });
		loadModels("../../../data/models/cube.dae").scale(0.1);
	}

	pEngine.bind(SIGNAL(depsLoaded), main);		
	pEngine.exec();
	// pEngine.renderFrame();
}