#ifndef ISCENE3D_TS
#define ISCENE3D_TS

#include "IScene.ts"

#define DL_DEFAULT 0
#define DL_LIGHTING 1

module akra {
	IFACE(ISceneNode);
	IFACE(ISceneModel);
	IFACE(ISceneObject);
	IFACE(ILightPoint);
	IFACE(ICamera);
	IFACE(ISprite);
	IFACE(IJoint);
	IFACE(IText3d);
	IFACE(IDisplayList);
	IFACE(IViewport);
	


	export interface IScene3d extends IScene {
		totalDL: uint;

		getRootNode(): ISceneNode;

		recursivePreUpdate(): void;
		updateCamera(): bool;
		updateScene(): bool;
		recursiveUpdate(): void;

		isUpdated(): bool;

		#ifdef DEBUG
		createObject(sName?: string): ISceneObject;
		#endif

		createNode(sName?: string): ISceneNode;
		createModel(sName?: string): ISceneModel;
		createCamera(sName?: string): ICamera;
		createLightPoint(sName?: string): ILightPoint;
		createSprite(sName?: string): ISprite;
		createJoint(sName?: string): IJoint;
		createText3d(sName?: string): IText3d;

		getDisplayList(index: uint): IDisplayList;
		getDisplayListByName(csName: string): int;
		addDisplayList(pList: IDisplayList): int;
		delDisplayList(index: uint): bool;
		
		signal nodeAttachment(pNode: ISceneNode): void;
		signal nodeDetachment(pNode: ISceneNode): void;

		signal displayListAdded(pList: IDisplayList, index: uint): void;
		signal displayListRemoved(pList: IDisplayList, index: uint): void;

		_render(pCamera: ICamera, pViewport: IViewport): void;
	}
}

#endif