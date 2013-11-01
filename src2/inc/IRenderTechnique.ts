#ifndef IRENDERTECHNIQUE_TS
#define IRENDERTECHNIQUE_TS

#include "IEventProvider.ts"
#include "IAFXComposer.ts"
#include "ISceneObject.ts"
#include "IRenderPass.ts"

module akra {
	IFACE(IRenderPass);
	IFACE(IRenderMethod);
	IFACE(IAFXComponentBlend);

	export interface IRenderTechnique extends IEventProvider {
		readonly totalPasses: uint;
		readonly modified: uint;
	readonly data: IAFXComponentBlend;

		destroy(): void;

		getPass(n: uint): IRenderPass;
		getMethod(): IRenderMethod;
		_getParentTechnique(): IRenderTechnique;

		setMethod(pMethod: IRenderMethod);
		isReady(): bool;

		setState(sName: string, pValue: any): void;
		setForeign(sName: string, pValue: any): void;
		setStruct(sName: string, pValue: any): void;

		setTextureBySemantics(sName: string, pValue: any): void;
		setShadowSamplerArray(sName: string, pValue: any): void;
		setVec2BySemantic(sName: string, pValue: any): void;

		addComponent(iComponentHandle: int, iShift?: int, iPass?: uint): bool;
		addComponent(pComponent: IAFXComponent, iShift?: int, iPass?: uint): bool;
		addComponent(sComponent: string, iShift?: int, iPass?: uint): bool;

		delComponent(iComponentHandle: int, iShift?: int, iPass?: uint): bool;
		delComponent(sComponent: string, iShift?: int, iPass?: uint): bool;
		delComponent(pComponent: IAFXComponent, iShift?: int, iPass?: uint): bool;

		hasComponent(sComponent: string, iShift?: int, iPass?: uint): bool;
		hasOwnComponent(sComponent: string, iShift?: int, iPass?: uint): bool;
		
		hasPostEffect(): bool;
		
		isPostEffectPass(iPass: uint): bool;
		isLastPass(iPass: uint): bool;
		isFirstPass(iPass: uint): bool;

		isFreeze(): bool;

		updatePasses(bSaveOldUniformValue: bool): void;

		_blockPass(iPass: uint): void;

        _setPostEffectsFrom(iPass: uint): void;
        
		_setComposer(pComposer: IAFXComposer): void;
		_getComposer(): IAFXComposer;
		_renderTechnique(pViewport: IViewport, pRenderable: IRenderableObject, pSceneObject: ISceneObject): void;

		signal render(iPass: uint, pRenderable: IRenderableObject, pSceneObject: ISceneObject, pViewport: IViewport): void;
		signal ownBlenChange(pComponent: IAFXComponent, iShift: int, iPass: uint, bAdd: bool);
	}
}

#endif