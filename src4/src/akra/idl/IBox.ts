
module akra {
	export interface IBox {
		width: uint;
		height: uint;
		depth: uint;
	
		left: uint;
		top: uint;
		right: uint;
		bottom: uint;
		front: uint;
		back: uint;
	
		contains(pDest: IBox): boolean;
		isEqual(pDest: IBox): boolean;
		setPosition(iLeft: uint, iTop: uint, iWidth: uint, iHeight: uint, iFront?: uint, iDepth?: uint): void;
	
		toString(): string;
	}
	
	
}