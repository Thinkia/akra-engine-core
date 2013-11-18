#ifndef PACKER_TS
#define PACKER_TS


/// <reference path="AIPacker.ts" />



module akra.io {


	interface AIHash {{
		[type: string]: any[];
	}
	

	class Packer extends BinWriter implements AIPacker {
		protected _pHashTable: AIHash = {};
		protected _pTemplate: IPackerTemplate = getPackerTemplate();

		/** inline */ get template(): IPackerTemplate { return this._pTemplate; }

		private memof(pObject: any, iAddr: int, sType: string): void;
		private addr(pObject: any, sType: string): int;
		private nullPtr(): void;
		private rollback(n?: int): Uint8Array[];
		private append(pData: Uint8Array[]): void;
		private append(pData: ArrayBuffer): void;
		private append(pData: Uint8Array): void;
		private writeData(pObject: any, sType: string): boolean;

		write(pObject: any, sType?: string): boolean;

		private memof(pObject: any, iAddr: int, sType: string): void {
			if (sType === "Number") {
				return;
			}

			var pTable: AIHash = this._pHashTable;
			var pCell: any[] = pTable[sType];

			if (!isDef(pCell)) {
				pCell = pTable[sType] = [];
			}

			pCell.push(pObject, iAddr);
		}

		private addr(pObject: any, sType: string): int {
			if (sType === "Number") {
				return -1;
			}

			var pTable: AIHash = this._pHashTable;
			var iAddr: int;
			var pCell: any[] = pTable[sType];

			if (isDef(pCell)) {

				for (var i: int = 0, n: int = pCell.length / 2; i < n; ++ i) {
					var j = 2 * i;

					if (pCell[j] === pObject) {
						return <int>pCell[j + 1];
					}
				}
			}

			return -1;
		}

		private /** inline */ nullPtr(): void {
			return this.uint32(MAX_UINT32);
		}


		private rollback(n: int = 1): Uint8Array[] {
			if (n === -1) {
				n = this._pArrData.length;
			}

			var pRollback: Uint8Array[] = new Array(n);
			var iRollbackLength: int = 0;

			for (var i: int = 0; i < n; ++ i) {
				pRollback[i] = this._pArrData.pop();
				iRollbackLength += pRollback[i].byteLength;
			}

			this._iCountData -= iRollbackLength;

			return pRollback;
		}

		private append(pData: any): void {
			if (isArray(pData)) {
				for (var i: int = 0; i < (<Uint8Array[]>pData).length; ++ i) {
					this._pArrData.push((<Uint8Array[]>pData)[i]);
					this._iCountData += (<Uint8Array[]>pData)[i].byteLength;
				}
			}
			else{
				if (isArrayBuffer(pData)) {
					pData = new Uint8Array(pData);
				}
				this._pArrData.push(<Uint8Array>pData);
				this._iCountData += (<Uint8Array>pData).byteLength;
			}
		}
		private x: int = 0;
		private writeData(pObject: any, sType: string): boolean {
			var pTemplate: IPackerTemplate = this.template;
			var pProperties: IPackerCodec = pTemplate.properties(sType);
			var fnWriter: Function = null;

			fnWriter = pProperties.write;
			

			this.x ++;
			if (this.x % 1000 == 0)
				console.log((this.byteLength / (1024 * 1024)).toFixed(2), "mb");


			if (!isNull(fnWriter)) {
				 if (fnWriter.call(this, pObject) === false) {
					ERROR("cannot write type: " + sType);
				}

				return true;
			}

			debug_assert(isDefAndNotNull(pProperties), "unknown object <" + sType + "> type cannot be writed");
			return true;
		}

		write(pObject: any, sType: string = null): boolean {
			var pProperties: IPackerCodec;
			var iAddr: int, iType: int;
			var pTemplate: IPackerTemplate = this.template;

			if (isNull(pObject)) {
				this.nullPtr();
				return false;
			}

			if (isNull(sType)) {
				sType = pTemplate.detectType(pObject);
			}


			pProperties = pTemplate.properties(sType);
			iType = pTemplate.getTypeId(sType);
	

			if (!isDef(pObject) || !isDef(iType)) {
				this.nullPtr();
				return false;
			}
		   	
		   	iAddr = this.addr(pObject, sType);
			

			if (iAddr < 0) {
				iAddr = this.byteLength + 4 + 4;

				this.uint32(iAddr); 
				this.uint32(iType);

				if (this.writeData(pObject, sType)) {
					this.memof(pObject, iAddr, sType);
				}
				else {
					this.rollback(2);
					this.nullPtr();
				}
			}
			else {
				this.uint32(iAddr);
				this.uint32(iType);
			}

			return true;
		}
	}

	function dump(pObject: any): ArrayBuffer {
		var pPacker: AIPacker = new Packer;
		pPacker.write(pObject);
		return pPacker.data();
	}
	
}

#endif
