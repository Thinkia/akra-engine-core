#ifndef UIGRAPHROUTE_TS
#define UIGRAPHROUTE_TS

#include "IUIGraph.ts"
#include "IUIGraphRoute.ts"
#include "IUIGraphConnector.ts"

#include "util/Color.ts"


module akra.ui.graph {
	export class Route implements IUIGraphRoute {
		/** Route left address */
		protected _pLeft: IUIGraphConnector = null;
		/** Route right address */
		protected _pRight: IUIGraphConnector = null;

		/** Route status. */
		protected _bActive: boolean = false;
		protected _bHighlighted: boolean = false;
		protected _bEnabled: boolean = true;

		/** Route domain */
		protected _pPath: RaphaelPath = null;
		protected _pArrow: RaphaelPath = null;
		protected _pColor: IColor;
		protected _pInactiveColor: IColor = new Color(.0, .0, .0, .75);
		protected _fWeight: float = 1.;
		protected _fMaxWeight: float = 1.;

		 get inactiveColor(): IColor { return this._pInactiveColor; }
		 get color(): IColor { return this._pColor; }
		 get left(): IUIGraphConnector { return this._pLeft; }
		 get right(): IUIGraphConnector { return this._pRight; }
		 get weight(): float { return this._fWeight; }

		set left(pConnector: IUIGraphConnector) {
			if (!isNull(this._pLeft)) {
				this._pLeft.destroy();
			}

			this._pLeft = pConnector;
		}

		set right(pConnector: IUIGraphConnector) {
			if (!isNull(this._pRight)) {
				this._pRight.destroy();
			}

			this._pRight = pConnector;
		}

		 get arrow(): RaphaelPath {
			return this._pArrow;
		}

		 set arrow(pPath: RaphaelPath) {
			var pRoute: Route = this;

		    (<RaphaelElement>pPath).click((e: IUIEvent) => { e.stopPropagation(); pRoute.activate(!pRoute.isActive()); });

			this._pArrow = pPath;
		}

		 set weight(fWeight: float) {
			LOG(__CALLSTACK__)
			this._fWeight = fWeight;
		}

		 get path(): RaphaelPath {
			return this._pPath;
		}

		 get canvas(): RaphaelPaper {
			return this.left.graph.canvas;
		}

		 set path(pPath: RaphaelPath) {

		    var pRoute: Route = this;

		    (<RaphaelElement>pPath).click((e: IUIEvent) => { e.stopPropagation(); pRoute.activate(!pRoute.isActive()); });

		    this._pPath = pPath;
		}

		 get enabled(): boolean { return this._bEnabled; }
		 set enabled(b: boolean) { 
			if (b === this._bEnabled) {
				return;
			}

			this._bEnabled = b; 

			this.routing();
		}

		constructor (pLeft: IUIGraphConnector, pRight: IUIGraphConnector) {
			this._pLeft = pLeft;
			this._pRight = pRight;
			this._pColor = util.randomColor(true);
			this._pColor.a = .5;

			if (!isNull(pLeft)) {
				pLeft.route = this;
			}

			if (!isNull(pRight)) {
				pRight.route = this;
			}
		}

		 isConnectedWithNode(pNode: IUIGraphNode): boolean {
			return this.left.node === pNode || this.right.node === pNode;
		}

		 isConnectedWith(pConnector: IUIGraphConnector): boolean {
			return this.left === pConnector || this.right === pConnector;
		}

		 isBridge(): boolean {
			return !isNull(this.left) && !isNull(this.right);
		}

		 isActive(): boolean {
			return this._bActive;
		}

		detach(): void {
			this._pLeft = null;
			this._pRight = null;
		}

		remove(bRecirsive: boolean = false): void {
			if (!isNull(this.left)) {
				this.left.routeBreaked(this);
				bRecirsive && this.left.destroy();
			}

			if (!isNull(this.right)) {
				this.left.routeBreaked(this);
				bRecirsive && this.right.destroy();
			}

			if (!isNull(this.path)) {
				(<RaphaelElement>this.path).remove();
				(<RaphaelElement>this.arrow).remove();
			}
		}

		sendEvent(e: IUIGraphEvent): void {
			if (!this.enabled) {
				return;
			}

			for (var i: int = 0; i < e.traversedRoutes.length; ++ i) {
				if (e.traversedRoutes[i] === this) {
					return;
				}
			}

			e.traversedRoutes.push(this);

			if (!isNull(this.right)) {
				this.right.sendEvent(e);
			}

			switch (e.type) {
				case EUIGraphEvents.SHOW_MAP:
					this._bHighlighted = true;
					this.left.el.css("backgroundColor", this.color.html);
					this.right.el.css("backgroundColor", this.color.html);
					this.routing();
					break;
				case EUIGraphEvents.HIDE_MAP:
					this._bHighlighted = false;
					this.left.el.css("backgroundColor", "");
					this.right.el.css("backgroundColor", "");
					this.routing();
					break;
			}
		}

		destroy(): void {
			this.remove(false);
		}

		activate(bValue: boolean = true): void {
			if (this.isActive() === bValue) {
				return;
			}

			// if (bValue === false && (this.left.isActive() || this.right.isActive())) {
			// 	return;
			// }

			this._bActive = bValue;

			if (!isNull(this.path)) {
				(<RaphaelElement>this.path).attr({"stroke-width": bValue? 3 : 1});
			}

			this.left && this.left.activate(bValue);
    		this.right && this.right.activate(bValue);
		}

		routing(): void {
			var pLeft: IPoint = Route.calcPosition(this.left);
			var pRight: IPoint = Route.calcPosition(this.right);

			this.drawRoute(pLeft, pRight, this.left.orient, this.right.orient);
		}

		protected drawRoute(pFrom: IPoint, pTo: IPoint, 
				eFromOr: EGraphConnectorOrient = EGraphConnectorOrient.UNKNOWN, 
				eToOr: EGraphConnectorOrient = EGraphConnectorOrient.UNKNOWN): void {

			var pFromAdd: IPoint = {x: 0, y: 0};
			var pToAdd: IPoint = {x: 0, y: 0};
			var dY: float = pTo.y - pFrom.y;
			var dX: float = pTo.x - pFrom.x;
			var isVertF: boolean = false;
			var isVertT: boolean = false;
			
			if (eFromOr == EGraphConnectorOrient.UP || eFromOr == EGraphConnectorOrient.DOWN) {
				isVertF = true;
			}

			if (eToOr == EGraphConnectorOrient.UP || eToOr == EGraphConnectorOrient.DOWN) {
				isVertT = true;
			}

			if (isVertT != isVertF) {
				this.drawRoute(pFrom, pTo);
				return;
			}


			if (dY > 0) {
				if (eFromOr == EGraphConnectorOrient.UP) {
					pFromAdd.y = dY;
				}

				if (eToOr == EGraphConnectorOrient.DOWN) {
					pToAdd.y = -dY;
				}

			}

			if (dY < 0) {
				if (eFromOr == EGraphConnectorOrient.DOWN) {
					pFromAdd.y = -dY;
				}

				if (eToOr == EGraphConnectorOrient.UP) {
					pToAdd.y = dY;
				}
			}

			if (dX > 0) {

				if (eFromOr == EGraphConnectorOrient.LEFT) {
					pFromAdd.x = dX;
				}

				if (eToOr == EGraphConnectorOrient.RIGHT) {
					pToAdd.x = -dX;
				}
			}

			if (dX < 0) {
				if (eFromOr == EGraphConnectorOrient.RIGHT) {
					pFromAdd.x = -dX;
				}

				if (eToOr == EGraphConnectorOrient.LEFT) {
					pToAdd.x = dX;
				}
			}

			var pPath: any = [
	            [<any>"M", pFrom.x, pFrom.y], [<any>"C", 
	            //output direction 
	            pFrom.x,
	            pFrom.y,

	            isVertF? pFrom.x: ((pFrom.x + pFromAdd.x) * 7 + pTo.x * 3) / 10,  
	            isVertF? ((pFrom.y + pFromAdd.y) * 7 + pTo.y * 3) / 10: pFrom.y, 

	            (pFrom.x + pTo.x) / 2, 
	            (pFrom.y + pTo.y) / 2, 

	            (pFrom.x + pTo.x) / 2, 
	            (pFrom.y + pTo.y) / 2, 

	            isVertT? pTo.x: (pFrom.x * 3 + (pTo.x + pToAdd.x) * 7) / 10, 
	            isVertT? (pFrom.y * 3 + (pTo.y + pToAdd.y) * 7) / 10: pTo.y, 

	            //middle point
	            pTo.x,
	            pTo.y,
	            ]
	        ];
	        var sColor: string = this._bHighlighted? this.color.htmlRgba: this.inactiveColor.htmlRgba;
	        var fWeight: float = this._bHighlighted? 2. * this._fMaxWeight * this._fWeight: this._fMaxWeight * this._fWeight;

	        sColor = this.isBridge()? sColor : "rgba(255, 255, 255, 1.)";

	        if (!this.enabled) {
	        	sColor = "rgba(55, 55, 55, .5)";
	        	fWeight = this._fMaxWeight * this._fWeight;
	        }
	        
	        if (!isNull(this.path)) {
	        	(<RaphaelElement>this.path).attr({
	        		path: pPath,
	        		"stroke": sColor,
	        		"stroke-width": fWeight
	        	});
	        }
	        else {
	        	this.path = (<RaphaelElement>(<any>this.canvas).path(pPath)).attr({
		        		"stroke": sColor, 
		        		"stroke-width": fWeight, 
		        		"stroke-linecap": "round"
	        		});
	        	
	        }


	        var iLength: int = (<any>this.path).getTotalLength();
	        var iArrowHeight: int = 3;
	        var iArrowWidth: int = 10;

	        var pCenter: IPoint = (<any>this.path).getPointAtLength(math.max(iLength - iArrowWidth, 0));
	        var pArrowPos: IPoint = (<any>this.path).getPointAtLength(math.max(this.isBridge()? iLength - 5: iLength, 0));

	        var fAngle: float = math.HALF_PI + math.atan2(pCenter.x - pTo.x, pTo.y - pCenter.y);
	        // fAngle = (fAngle / (math.TWO_PI)) * 360;
	        

	        var pA0: IPoint = {x: (0 - iArrowWidth), y: (0 - iArrowHeight)};
	        var pA1: IPoint = {x: (0 - iArrowWidth), y: (0 + iArrowHeight)};

	        var pA0n: IPoint = {
	        	x: pA0.x * math.cos(fAngle) - pA0.y * math.sin(fAngle), 
	        	y: pA0.x * math.sin(fAngle) + pA0.y * math.cos(fAngle)
			};
	        
	        var pA1n: IPoint = {
	        	x: pA1.x * math.cos(fAngle) - pA1.y * math.sin(fAngle), 
	        	y: pA1.x * math.sin(fAngle) + pA1.y * math.cos(fAngle)
			};

			var pArrow: any = [
				[<any>"M", pArrowPos.x, pArrowPos.y], 
				[<any>"L", pArrowPos.x + pA0n.x, pArrowPos.y + pA0n.y], 
				[<any>"L", pArrowPos.x + pA1n.x, pArrowPos.y + pA1n.y], 
				[<any>"L", (pArrowPos.x), (pArrowPos.y)]
			];
			
	        if (!isNull(this.arrow)) {
	        	(<RaphaelElement>this.arrow).attr({
	        		path: pArrow,
	        		"fill": sColor
	        	});
	        }
	        else {
	        	this.arrow = (<any>(<RaphaelElement>(<any>this.canvas).path(pArrow)).attr({
	        			"fill": sColor,
	        			//"stroke": "#FF0", 
		        		"stroke-width": 1
	        		}));
	        }

	        // (<any>this.arrow).rotate(90 + fAngle, pTo.x, pTo.y);
		}

		static calcPosition(pConnector: IUIGraphConnector): IPoint {
			var pGraph: IUIGraph = pConnector.graph;

			var pGraphOffset = pGraph.$element.offset();
		    var pPosition = pConnector.$element.offset();
		    var pOut: IPoint = {x: pPosition.left - pGraphOffset.left, y: pPosition.top - pGraphOffset.top};

		    pOut.x += pConnector.$element.width() / 2.;
		    pOut.y += pConnector.$element.height() / 2.;

		    return pOut;
		}
	}

	export class TempRoute extends Route implements IUITempGraphRoute {
		constructor(pLeft: IUIGraphConnector) {
			super(pLeft, null);
		}

		routing(pRight: IPoint = {x: 0, y: 0}): void {
			var pLeft: IPoint = Route.calcPosition(this.left);

			this.drawRoute(pLeft, pRight);
		}
	}
}

#endif

