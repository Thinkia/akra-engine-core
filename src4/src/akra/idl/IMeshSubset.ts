
/// <reference path="IEventProvider.ts" />
/// <reference path="IMesh.ts" />
/// <reference path="ISkin.ts" />
/// <reference path="IRenderData.ts" />
/// <reference path="IRect3d.ts" />


module akra {
	export interface IMeshSubset extends IEventProvider, IRenderableObject {
		name: string;
	
		/** readonly */ mesh: IMesh;
		/** readonly */ skin: ISkin;
		/** readonly */ data: IRenderData;
		/** readonly */ boundingBox: IRect3d;
		/** readonly */ boundingSphere: ISphere;
	
		createBoundingBox(): boolean;
		deleteBoundingBox(): boolean;
		showBoundingBox(): boolean;
		hideBoundingBox(): boolean;
		isBoundingBoxVisible(): boolean;
	
		createBoundingSphere(): boolean;
		deleteBoundingSphere(): boolean;
		showBoundingSphere(): boolean;
		hideBoundingSphere(): boolean;
		isBoundingSphereVisible(): boolean;
	
		computeNormals(): void;
		computeTangents(): void;
		computeBinormals(): void;
	
		isSkinned(): boolean;
		isOptimizedSkinned(): boolean;
		getSkin(): ISkin;
		setSkin(pSkin: ISkin): boolean;
	
		/** @deprecated */
		applyFlexMaterial(csMaterial: string, pMaterial?: IMaterial): boolean;
		/** @deprecated */
		getFlexMaterial(iMaterial: int): IMaterial;
		/** @deprecated */
		getFlexMaterial(csName: string): IMaterial;
		/** @deprecated */
		setFlexMaterial(iMaterial: int): boolean;
		/** @deprecated */
		setFlexMaterial(csName: string): boolean;
	
		show(): void;
		hide(): void;
		isRenderable(): boolean;
	
		destroy(): void;
	
		_calculateSkin(): boolean;
	
		signal skinAdded(pSkin: ISkin): void;
	}
	
}