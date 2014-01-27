/// <reference path="../../idl/IAnimationController.ts" />
/// <reference path="../../idl/IUIAnimationGraph.ts" />
/// <reference path="../../idl/IUIAnimationNode.ts" />
/// <reference path="../../idl/IUIAnimationBlender.ts" />
/// <reference path="../../idl/IUIAnimationPlayer.ts" />
/// <reference path="../../idl/IUtilTimer.ts" />

/// <reference path="../../animation/Animation.ts" />
/// <reference path="../../filedrop/filedrop.ts" />

/// <reference path="../graph/Graph.ts" />
/// <reference path="Controls.ts" />
/// <reference path="Blender.ts" />

/// <reference path="io/Importer.ts" />

module akra.ui.animation {
	class DropSignal extends Signal<{ (pGraph: IUIAnimationGraph, e: IUIEvent, pComponent: IUIComponent, pInfo?: any): void; }, IUIAnimationGraph> {
		emit(e?: IUIEvent, pComponent?: IUIComponent, pInfo?: any): void {
			super.emit(e, pComponent, info);

			var pGraph: IUIAnimationGraph = this.getSender();

			if (isComponent(pComponent, EUIComponents.COLLADA_ANIMATION)) {
				var pColladaAnimation: any = pComponent;
				var pAnimation = pColladaAnimation.collada.extractAnimation(pColladaAnimation.index);
				// this.addAnimation(pAnimation);
				pGraph.createNodeByAnimation(pAnimation);
			}
		}
	}

	export class Graph extends graph.Graph implements IUIAnimationGraph {
		private _pSelectedNode: IUIAnimationNode = null;
		private _pAnimationController: IAnimationController = null;

		constructor(parent, options) {
			super(parent, options, EUIGraphTypes.ANIMATION);

			this.setupFileDropping();
			this.setDroppable();
		}


		protected setupSignals(): void {
			this.drop = this.drop || new DropSignal(this);
			this.nodeSelected = this.nodeSelected || new Signal(<any>this);
			super.setupSignals();
		}

		

		private setupFileDropping(): void {
			var pGraph = this;
			var pRmgr: IResourcePoolManager = ide.getResourceManager();


			filedrop.addHandler(null, {
				drop: (file: File, content, format, e: DragEvent): void => {
					pGraph.el.removeClass("file-drag-over");



					var pName: IPathinfo = path.parse(file.name);
					var sExt: string = pName.ext.toUpperCase();

					if (sExt == "DAE") {
						console.log("before resource creation...");
						var pModelResource: ICollada = <ICollada>pRmgr.colladaPool.createResource(pName.toString());
						console.log("before model parsing...");
						pModelResource.parse(<string>content, { scene: false, name: pName.toString() });

						var pAnimations: IAnimation[] = pModelResource.extractAnimations();

						for (var j = 0; j < pAnimations.length; ++j) {
							pGraph.addAnimation(pAnimations[j]);
							pGraph.createNodeByAnimation(pAnimations[j]);
						}
					}

					if (sExt == "JSON") {
						var pImporter = new io.Importer(ide.getEngine());
						pImporter.import(content);
						this.createNodeByController(pImporter.getController());

					}
				},

				verify: (file: File, e: DragEvent): boolean => {
					if (e.target !== (<any>pGraph).$svg[0]) {
						return false;
					}

					return true;
				},

				// dragenter: (e) => {
				// 	pGraph.el.addClass("file-drag-over");
				// },

				dragover: (e) => {
					pGraph.el.addClass("file-drag-over");
				},

				dragleave: (e) => {
					pGraph.el.removeClass("file-drag-over");
				},

				format: EFileDataTypes.TEXT
			});
		}


		getController(): IAnimationController {
			return this._pAnimationController;
		}

		selectNode(pNode: IUIAnimationNode, bModified: boolean = false): void {
			var bPlay: boolean = true;

			if (this._pSelectedNode === pNode) {

				if (bModified) {
					ide.cmd(ECMD.INSPECT_ANIMATION_NODE, pNode);
				}

				return;
			}

			ide.cmd(ECMD.INSPECT_ANIMATION_NODE, pNode);

			this._pSelectedNode = pNode;


			if (bPlay) {
				this._pAnimationController.play.emit(pNode.animation);
			}

			this.nodeSelected.emit(pNode, bPlay);
		}

		nodeSelected: ISignal<{ (pGraph: IUIAnimationGraph, pNode: IUIAnimationNode, bPlay: boolean): void; }>;

		//BROADCAST(nodeSelected, CALL(pNode, bPlay));

		addAnimation(pAnimation: IAnimationBase): void {
			this._pAnimationController.addAnimation(pAnimation);
		}

		removeAnimation(pAnimation: IAnimationBase): void;
		removeAnimation(sAnimation: string): void;
		removeAnimation(iAnimation: int): void;
		removeAnimation(animation): void {
			this._pAnimationController.removeAnimation(<int>animation);
		}

		findNodeByAnimation(sName: string): IUIAnimationNode;
		findNodeByAnimation(pAnimation: IAnimationBase): IUIAnimationNode;
		findNodeByAnimation(animation): IUIAnimationNode {
			var sName: string = !isString(animation) ? (<IAnimationBase>animation).name : <string>animation;
			var pNodes: IUIAnimationNode[] = <IUIAnimationNode[]>this.nodes;

			for (var i: int = 0; i < pNodes.length; i++) {
				var pAnim: IAnimationBase = pNodes[i].animation;

				if (!isNull(pAnim) && pAnim.name === sName) {
					return pNodes[i];
				}
			}

			return null;
		}

		createNodeByController(pController: IAnimationController): void {
			var pNode: IUIAnimationNode = null;
			// LOG("createNodeByController(", pController ,")")
			for (var i: int = 0; i < pController.totalAnimations; ++i) {
				var pAnimation: IAnimationBase = pController.getAnimation(i);
				pNode = this.createNodeByAnimation(pAnimation);
			}

			return;
		}

		createNodeByAnimation(pAnimation: IAnimationBase): IUIAnimationNode {
			var pNode: IUIAnimationNode = this.findNodeByAnimation(pAnimation.name);
			var pSubAnim: IAnimationBase = null;
			var pSubNode: IUIAnimationNode = null;
			var pBlend: IAnimationBlend = null;
			var pBlender: IUIAnimationBlender = null;
			var pPlayer: IUIAnimationPlayer = null;
			var pMaskNode: IUIAnimationNode = null;

			var pMask: IMap<float> = null;
			var pGraph: IUIAnimationGraph = this;

			function connect(pGraph: IUIGraph, pFrom: IUIGraphNode, pTo: IUIGraphNode): void {
				pGraph.createRouteFrom(pFrom.getOutputConnector());
				pGraph.connectTo(pTo.getInputConnector());
			}

			if (!isNull(pNode)) {
				return pNode;
			}

			if (akra.animation.Animation.isAnimation(pAnimation)) {
				pNode = <IUIAnimationNode>new Data(this, <IAnimation>pAnimation);
				this.addAnimation(pAnimation);
			}
			else if (akra.animation.Blend.isBlend(pAnimation)) {
				pBlender = pNode = new Blender(this, <IAnimationBlend>pAnimation);
				pBlend = <IAnimationBlend>pAnimation;
				// pBlender.animation = pBlend;

				for (var i = 0; i < pBlend.totalAnimations; i++) {
					pSubAnim = pBlend.getAnimation(i);
					pSubNode = this.createNodeByAnimation(pSubAnim);
					pMask = pBlend.getAnimationMask(i);

					if (isDefAndNotNull(pMask)) {
						pMaskNode = pBlender.getMaskNode(i);

						if (!pMaskNode) {
							pMaskNode = new Mask(this, pMask);
							// pMaskNode.animation = pSubAnim;
						}


						connect(this, pSubNode, pMaskNode);
						connect(this, pMaskNode, pBlender);

						// if (pSubAnim.extra && pSubAnim.extra.mask) {
						//     if (pSubAnim.extra.mask.position) {
						//         pMaskNode.position(pSubAnim.extra.mask.position.x, pSubAnim.extra.mask.position.y);
						//     }
						// }

						pMaskNode.routing();
					}
					else {
						connect(this, pSubNode, pBlender);
					}

					pSubNode.routing();
				};

				pBlender.setup();
			}
			else if (akra.animation.Container.isContainer(pAnimation)) {
				pPlayer = pNode = new Player(this, <IAnimationContainer>pAnimation);
				// pPlayer.animation = pAnimation;

				pSubAnim = (<IAnimationContainer>pAnimation).getAnimation();
				// console.log(pSubAnim);
				pSubNode = this.createNodeByAnimation(pSubAnim);
				// console.log(this, pSubNode, pPlayer);
				connect(this, pSubNode, pPlayer);
			}
			else {
				logger.error("unsupported type of animation detected >> ", pAnimation);
			}

			if (pAnimation.extra) {
				if (pAnimation.extra.graph) {
					setTimeout(() => {
						var o = pGraph.el.offset();
						pNode.el.offset({ left: o.left + pAnimation.extra.graph.x, top: o.top + pAnimation.extra.graph.y });

						if (pBlender) {
							var o = pBlender.el.offset();
							for (var i = 0; i < pBlender.totalMasks; ++i) {
								var pMaskNode = pBlender.getMaskNode(i);

								if (!pMaskNode) {
									continue;
								}

								pMaskNode.el.offset({ left: o.left - 60 - pMaskNode.el.width() + i * 30, top: o.top - 30 + i * 30 });
								pMaskNode.routing();
							}
						}

						pNode.routing();
					}, 15);
				}
			}

			pNode.routing();

			if (pAnimation === this.getController().active) {
				this.selectNode(pNode);
			}

			return pNode;
		}

		capture(pController: IAnimationController): boolean {
			logger.assert(isNull(this._pAnimationController), ("controller exists!!!"));

			this._pAnimationController = pController;

			//this.connect(pController, SIGNAL(play), SLOT(onControllerPlay));
			pController.play.connect(this, this.onControllerPlay);
			//this.connect(pController, SIGNAL(animationAdded), SLOT(animationAdded));
			pController.animationAdded.connect(this, this.animationAdded);

			this.createNodeByController(pController);

			return true;
		}

		private animationAdded(pController: IAnimationController, pAnimation: IAnimationBase): void {

		}

		private onControllerPlay(pController: IAnimationController, pAnimation: IAnimationBase): void {
			// var pNode: IUIAnimationNode = this.findNodeByAnimation(pAnimation.name);
			// this.selectNode(pNode);
		}

		addChild(pChild: IEntity): IEntity {
			pChild = super.addChild(pChild);

			if (isComponent(pChild, EUIComponents.GRAPH_NODE)) {
				var pNode: IUIGraphNode = <IUIGraphNode>pChild;
				//this.connect(pNode, SIGNAL(selected), SLOT(selectNode));
				pNode.selected.connect(this, <(pNode: IUIGraphNode, bModifierd: boolean) => void>this.selectNode);
			}

			return pChild;
		}

		protected finalizeRender(): void {
			super.finalizeRender();
			this.el.addClass("component-animationgraph");
		}

		static DropSignal = DropSignal;
	}

	register("animation.Graph", Graph);
}
