#ifndef BUFFERMAP_TS
#define BUFFERMAP_TS

#include "IBufferMap.ts"
#include "IVertexBuffer.ts"
#include "IEngine.ts"
#include "core/pool/ReferenceCounter.ts"

module akra.model {

	export class BufferMap implements IBufferMap extends ReferenceCounter{
		private _pFlows: IDataFlow[] = null;
		private _pMappers = null;
		private _pIndex = null;
		private _nLength: uint = 0;
		private _ePrimitiveType: EPrimitiveTypes;
		private _pCompleteFlows: IDataFlow[] = null;
		private _nCompleteFlows: uint = 0;
		private _nCompleteVideoBuffers: uint = 0;
		private _pCompleteVideoBuffers: IVertexBuffer[] = null;
		private _nUsedFlows: uint = 0;
		private _pEngine: IEngine = null;
		private _nStartIndex: uint = 0;
		private _pBuffersCompatibleMap = null;

		constructor(pEngine: IEngine){
			super();
			this._pEngine = pEngine;
			this.reset();
		}

		inline get primType(): EPrimitiveTypes{
			return this._pIndex ? this._pIndex.getPrimitiveType() : this._ePrimitiveType;
		}

		inline set primType(eType: EPrimitiveTypes){
			this._ePrimitiveType = eType;
		}

		inline get primCount(): uint{
			switch (this._ePrimitiveType) {
	            case EPrimitiveTypes.TRIANGLELIST:
	                return this.length / 3.;
	            case EPrimitiveTypes.POINTLIST:
	                return this.length;
	            case EPrimitiveTypes.TRIANGLESTRIP:
	        }

	        return undefined;
		}

		inline get index(): IIndexData {
			return this._pIndex;
		}

		inline set index(pIndexData: IIndexData) {
			if (this._pIndex === pIndexData) {
	            return;
	        }
	        this.draw = this.drawElements = pIndexData.drawElements;
	        this._pIndex = pIndexData;
	        this.update();
		}

		inline get limit(): uint {
			return this._pFlows.length;
		}

		inline get length(): uint {
			return (this._pIndex? this._pIndex.getCount(): this._nLength);
		}

		inline set length(nLength: uint) {
			this._nLength = Math.min(this._nLength, nLength);
		}

		inline get startIndex(): uint {
			return this._nStartIndex;
		}

		inline get size(): uint{
			return this._nCompleteFlows;
		}

		inline get flows(): IDataFlow[] {
			return this._pCompleteFlows;
		}

		inline get mappers(): IDataMapper[] {
			return this._pMappers;
		}

		inline get offset(): uint {
			return (this._pIndex? this._pIndex.getOffset(): 0);
		}

		draw() {

		}

		drawElements() {

		}

		getFlow(iFlow: int, bComplete?: bool): IDataFlow {
			bComplete = bComplete || true;

		    if (typeof arguments[0] === 'string') {
		        var nTotal: int; 
		        var pFlows: IDataFlow[];
		        
		        if (bComplete) {
		            pFlows = this._pCompleteFlows;
		            nTotal = this._nCompleteFlows;
		        }
		        else {
		            pFlows = this._pFlows;
		            nTotal = this._pFlows.length;
		        }

		        for (var i: int = 0; i < nTotal; ++ i) {
		            if (!pFlows[i].data) {
		                continue;
		            }
		            if (pFlows[i].data.hasSemantics(arguments[0])) {
		                return pFlows[i];
		            }
		        }

		        return null;
		    }
		    
		    if (bComplete) {
		        
		        for (var i: int = 0, pFlows = this._pCompleteFlows; i < this._nCompleteFlows; ++ i) {
		            if (pFlows[i].flow == iFlow) {
		                return pFlows[i];
		            }
		        }

		        return null;
		    }

		    return this._pFlows[iFlow];
		}
		reset(): void {
			this._pIndex = null
		    this._ePrimitiveType = EPrimitiveTypes.TRIANGLELIST;


		    var nFlowLimit = Math.min(
		        16,//a.info.graphics.maxVertexTextureImageUnits(pDevice),
		        info.graphics.maxVertexAttributes
		    );

		    this._pMappers = [];
		    this._pFlows = new Array(nFlowLimit);
		    for (var i = 0; i < nFlowLimit; i++) {
		        this._pFlows[i] = {
		            flow: i,
		            data:  null,
		            type:  EDataFlowTypes.UNMAPPABLE,
		            mapper:null
		        };
		    }

		    this._nLength = MAX_INT32;
		    this._pCompleteFlows = new Array(nFlowLimit);
		    this._nCompleteFlows = 0;
		    this._nStartIndex = MAX_INT32;
		    this._pBuffersCompatibleMap = {};

		    this._pCompleteVideoBuffers = new Array(nFlowLimit);
		    this._nCompleteVideoBuffers = 0;
		    this._nUsedFlows = 0;

		    this.draw = this.drawArrays;
		}

		flow(iFlow: uint, pVertexData: IVertexData): int {
			var pFlow: IDataFlow;

		    if (arguments.length < 2) {
		        pVertexData = arguments[0];
		        iFlow = (this._nUsedFlows ++);
		    }
		    // trace(iFlow, '<<==', pVertexData.getVertexDeclaration().toString());
		    // console.log((new Error).stack);
		    pFlow = this._pFlows[iFlow];

		    debug_assert(iFlow < this.limit,
		        'Invalid strem. Maximum allowable number of stream ' + this.limit + '.');

		    if (!pVertexData || pFlow.data === pVertexData) {
		        return -1;
		    }

		    if (pVertexData.buffer instanceof core.pool.resources.VertexBuffer) {
		        pFlow.type = EDataFlowTypes.UNMAPPABLE;
		        this.length = pVertexData.getCount();
		        //this.startIndex = pVertexData.getStartIndex();
		        debug_assert(this.checkData(pVertexData),
		            'You can use several unmappable data flows from one buffer.');

		        this._pushEtalon(pVertexData);
		    }
		    else {
		        pFlow.type = EDataFlowTypes.MAPPABLE;
		    }

		    pFlow.data = pVertexData;

		    return this.update()? iFlow: -1;
		}

		checkData(pData: IVertexData): bool {
			var pEtalon = this._pBuffersCompatibleMap[pData.resourceHandle()];
		    if (!pEtalon || pEtalon.offset === pData.offset) {
		        return true;
		    }
		    return false;
		}

		protected findMapping(pMap, eSemantics, iAddition): IDataMapper {
		    debug_assert(this.checkData(pMap), 'You can use several different maps from one buffer.');
		    for (var i = 0, pMappers = this._pMappers, pExistsMap; i < pMappers.length; i++) {
		        pExistsMap = pMappers[i].pData;
		        if (pExistsMap === pMap) {
		            //если уже заданные маппинг менял свой стартовый индекс(например при расширении)
		            //то необходимо сменить стартовый индекс на новый
		            if (pMappers[i].semantics === eSemantics && pMappers[i].addition == iAddition) {
		                return pMappers[i];
		            }
		        }
		        else {
		            debug_assert(pExistsMap.getStartIndex() === pMap.getStartIndex(),
		                'You can not use maps with different indexing');
		        }
		    }
		    return null;
		};


		mapping(iFlow: int, pMap: IVertexData, eSemantics: string, iAddition?: int): bool {
			iAddition = iAddition || 0;

		    var pMapper: IDataMapper = this.findMapping(pMap, eSemantics, iAddition);
		    var pFlow: IDataFlow     = this._pFlows[iFlow];

		    debug_assert(pFlow.data && pFlow.type === EDataFlowTypes.MAPPABLE,
		        'Cannot mapping empty/unmappable flow.');
		    debug_assert(isDef(pMap), 'Passed empty mapper.');

		    if (!eSemantics) {
		        eSemantics = pMap.getVertexDeclaration()[0].eUsage;
		    }
		    else if (pMap.hasSemantics(eSemantics) === false) {
		        debug_error('Passed mapper does not have semantics: ' + eSemantics + '.');
		        return false;
		    }

		    if (pMapper) {
		        if (pFlow.mapper === pMapper) {
		            return pMapper.semantics === eSemantics &&
		                pMapper.addition === iAddition? true: false;
		        }
		    }
		    else {
		        pMapper = {data: pMap, semantics: eSemantics, addition: iAddition};

		        this._pMappers.push(pMapper);
		        this.length = pMap.getCount();
		        //this.startIndex = pMap.getStartIndex();
		        this._pushEtalon(pMap);
		    }

		    pFlow.mapper = pMapper;

		    return this.update();
		}

		_pushEtalon(pData: IVertexData): void {
			this._pBuffersCompatibleMap[pData.resourceHandle()] = pData;
		}

		update(): bool {
			var pFlows: IDataFlow[] = this._pFlows;
		    var pFlow, pMapper;
		    var isMappable: bool = false;
		    var pCompleteFlows: IDataFlow[] = this._pCompleteFlows;
		    var nCompleteFlows: int = 0;
		    var pCompleteVideoBuffers: IVertexBuffer[] = this._pCompleteVideoBuffers;
		    var nCompleteVideoBuffers: int = 0;
		    var nUsedFlows: int = 0;
		    var pVideoBuffer: IVertexBuffer;
		    var isVideoBufferAdded: bool = false;
		    var nStartIndex: int = MAX_INT32, nCurStartxIndex: int;

		    for (var i: int = 0; i < pFlows.length; i++) {
		        pFlow = pFlows[i];
		        pMapper = pFlow.mapper;
		        isMappable = (pFlow.type === EDataFlowTypes.MAPPABLE);
		        
		        if (pFlow.data) {
		            nUsedFlows ++;
		        }

		        if (pFlow.data === null || (isMappable && pMapper === null)) {
		            continue;
		        }

		        pCompleteFlows[nCompleteFlows ++] = pFlow;

		        if (isMappable) {
		            nCurStartxIndex = pMapper.data.getStartIndex();
		            pVideoBuffer = pFlow.data.buffer;
		            for (var j = 0; j < nCompleteVideoBuffers; j++) {
		                if (pCompleteVideoBuffers[j] === pVideoBuffer) {
		                    isVideoBufferAdded = true;
		                    break;
		                }
		            }
		            if (!isVideoBufferAdded) {
		                pCompleteVideoBuffers[nCompleteVideoBuffers ++] = pVideoBuffer;
		            }
		        }
		        else {
		            nCurStartxIndex = pFlow.data.getStartIndex();
		        }

		        if (nStartIndex === MAX_INT32) {
		            nStartIndex = nCurStartxIndex;
		            continue;
		        }

		        debug_assert(nStartIndex == nCurStartxIndex,
		            'You can not use a maps or unmappable buffers having different starting index.');
		    }

		    this._nStartIndex = nStartIndex;
		    this._nCompleteFlows = nCompleteFlows;
		    this._nCompleteVideoBuffers = nCompleteVideoBuffers;
		    this._nUsedFlows = nUsedFlows;

		    return true;
		}
		clone(bWithMapping?: bool): IBufferMap {
			bWithMapping = isDef(bWithMapping) ? bWithMapping : true;

		    var pMap: IBufferMap = new BufferMap(this._pEngine);
		    for (var i = 0, pFlows = this._pFlows; i < pFlows.length; ++ i) {
		        if (pFlows[i].data === null) {
		            continue;
		        }

		        if (pMap.flow(pFlows[i].flow, pFlows[i].data) < 0) {
		            pMap = null;
		            return null;
		        }
		        
		        if (!bWithMapping) {
		            continue;
		        }

		        if (pFlows[i].mapper) {
	                pMap.mapping(pFlows[i].flow, 
	                pFlows[i].mapper.data, 
	                pFlows[i].mapper.semantics, 
	                pFlows[i].mapper.addition);
		        }
		    }

		    return pMap;
		} 
		toString(): string {
			function _an(sValue, n: int, bBackward?: bool) {
		        sValue = String(sValue);
		        bBackward = bBackward || false;

		        if (sValue.length < n) {
		            for (var i = 0, l = sValue.length; i < n - l; ++ i) {
		                if (!bBackward) {
		                    sValue += ' ';
		                }
		                else {
		                    sValue = ' ' + sValue;
		                }
		            }
		        }

		        return sValue;
		    }

		    var s = '\n\n', t;
		    s += '      Complete Flows     : OFFSET / SIZE   |   BUFFER / OFFSET   :      Mapping  / Shift    : OFFSET |    Additional    \n';
		    t  = '-------------------------:-----------------+---------------------:--------------------------:--------+------------------\n';
		    // = '#%1 [ %2 ]           :     %6 / %7     |       %3 / %4       :         %5       :        |                  \n';
		    // = '#%1 [ %2 ]           :     %6 / %7     |       %3 / %4       :         %5       :        |                  \n';
		    s += t;

		    for (var i: int = 0; i < this._nCompleteFlows; ++ i) {
		        var pFlow: IDataFlow = this._pCompleteFlows[i];
		        var pMapper: IDataMapper = pFlow.mapper;
		        var pVertexData: IVertexData = pFlow.data;
		        var pDecl:IVertexDeclaration = pVertexData.getVertexDeclaration();
		        //trace(pMapper); window['pMapper'] = pMapper;
		        s += '#' + _an(pFlow.flow, 2) + ' ' + 
		            _an('[ ' + (pDecl[0].eUsage !== a.DECLUSAGE.END? pDecl[0].eUsage: '<end>') + ' ]', 20) + 
		            ' : ' + _an(pDecl[0].iOffset, 6, true) + ' / ' + _an(pDecl[0].iSize, 6) + 
		            ' | ' + 
		            _an(pVertexData.resourceHandle(), 8, true) + ' / ' + _an(pVertexData.getOffset(), 8) + 
		            ' : ' + 
		            (pMapper? _an(pMapper.semantics, 15, true) + ' / ' + _an(pMapper.addition, 7) + ': ' + 
		                _an(pMapper.data.getVertexDeclaration().element(pMapper.semantics).iOffset, 6) :
		            _an('-----', 25) + ': ' + _an('-----', 6)) + ' |                  \n';
		        

		        for (var j = 1; j < pDecl.length; ++ j) {
		            s += '    ' + 
		            _an('[ ' + (pDecl[j].eUsage !== a.DECLUSAGE.END? pDecl[j].eUsage: '<end>') + ' ]', 20) + ' : ' + _an(pDecl[j].iOffset, 6, true) + ' / ' + _an(pDecl[j].iSize, 6) +  
		                  ' |                     :                          :        |                  \n';
		        }
		        s += t;
		    };
		    s += '=================================================================\n';
		    s += '      PRIMITIVE TYPE : ' + '0x' + this.primType.toString(16) + '\n';
		    s += '     PRIMITIVE COUNT : ' + this.primCount + '\n';
		    s += '         START INDEX : ' + this.startIndex + '\n';
		    s += '              LENGTH : ' + this.length + '\n';
		    s += '  USING INDEX BUFFER : ' + (this.index? 'TRUE': 'FALSE') + '\n';
		    s += '=================================================================\n';

		    return s + '\n\n';
		}
	}
}

#endif