﻿/// <reference path="Material.ts" />       
/// <reference path="FlexMaterial.ts" />       
/// <reference path="../data/VertexDeclaration.ts" /> 
/// <reference path="../data/Usage.ts" /> 
module akra.material {
    import VE = data.VertexElement;
    import VertexDeclaration = data.VertexDeclaration;
    import Usage = data.Usages;

    /** @const */
    export var VERTEX_DECL: IVertexDeclaration = VertexDeclaration.normalize(
        [
            VE.custom(Usage.MATERIAL, EDataTypes.FLOAT, 17),
            VE.custom(Usage.DIFFUSE, EDataTypes.FLOAT, 4, 0),
            VE.custom(Usage.AMBIENT, EDataTypes.FLOAT, 4, 16),
            VE.custom(Usage.SPECULAR, EDataTypes.FLOAT, 4, 32),
            VE.custom(Usage.EMISSIVE, EDataTypes.FLOAT, 4, 48),
            VE.custom(Usage.SHININESS, EDataTypes.FLOAT, 1, 64)
        ]);


    function create(sName: string = null, pMat: IMaterial = null): IMaterial {
        return new Material(sName, pMat);
    }

    /** @deprecated Flex material will be removed from core with closest release.*/
    function _createFlex(sName: string, pData: IVertexData): IMaterial {
        return new FlexMaterial(sName, pData);
    }
}