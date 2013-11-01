#ifndef SKELETON_TS
#define SKELETON_TS

#include "ISkeleton.ts"
#include "ISceneNode.ts"
#include "scene/Joint.ts"

module akra.model {

	class Skeleton implements ISkeleton{
		private _sName: string;
		private _pRootJoints: IJoint[] = [];
		private _pJointMap: IJointMap = null;
		private _pNodeList: ISceneNode[]  = null;
		private _pMeshNode: ISceneModel = null;
		// private _iFlags: bool = false;


		inline get totalBones(): int{
			return Object.keys(this._pJointMap).length;
		}

		inline get totalNodes(): int{
			return this._pNodeList.length;
		}

		inline get name(): string{
			return this._sName;
		}

		inline get root(): IJoint {
			return this._pRootJoints[0] || null;
		}

		constructor (sName: string = null) {
			this._sName = sName;
		}

		inline getRootJoint(): IJoint {
			return this.getRootJoints()[0];
		}

		inline getRootJoints(): IJoint[] {
			return this._pRootJoints;
		}

		inline getJointMap(): IJointMap {
			return this._pJointMap;
		}

		inline getNodeList(): ISceneNode[] {
			return this._pNodeList;
		}

		addRootJoint(pJoint: IJoint): bool {
			debug_assert(pJoint instanceof scene.Joint, 'node must be joint');

		    var pRootJoints = this._pRootJoints;

			for (var i = 0; i < pRootJoints.length; i++) {
				if (pJoint.childOf(pRootJoints[i])) {
					return false;
				}	
				else if (pRootJoints[i].childOf(pJoint)) {
					pRootJoints.splice(i, 1);
				}
			};

			this._pRootJoints.push(pJoint);

			return this.update();
		}

		update(): bool {
			var pRootJoints: IJoint[] 	= this.getRootJoints();
		    var pJointMap: IJointMap 	= this._pJointMap = <IJointMap>{};
		    var pNodeList: ISceneNode[] = this._pNodeList = [];
		    //var pNotificationJoints = this._pNotificationJoints = [];

		    function findNodes (pNode: ISceneNode): void {
		    	var sJoint: string = null;

		    	if (!isNull(pNode)) {
		    		if (scene.isJoint(pNode)) {
			    		sJoint = (<IJoint>pNode).boneName;
			    	}

			    	if (!isNull(sJoint)) {
			    		debug_assert(!pJointMap[sJoint], 
			    			'joint with name<' + sJoint + '> already exists in skeleton <' + this._sName + '>');
			    		
			    		pJointMap[sJoint] = <IJoint>pNode;
			    	}

			    	pNodeList.push(pNode);

			    	findNodes(<ISceneNode>pNode.sibling);
			    	findNodes(<ISceneNode>pNode.child);
		    	}
		    }

		    for (var i = 0; i < pRootJoints.length; i++) {
		    	findNodes(pRootJoints[i]);
		    };

			// for (var sJoint in pJointMap) {
			// 	var pJoint = pJointMap[sJoint];

		 //    	if (pJoint.sibling() == null && pJoint.child() == null) {
		 //    		pNotificationJoints.push(pJoint);
		 //    	}
		 //    };    

			return true;
		}

		findJoint(sName: string): IJoint {
			return this._pJointMap[sName];
		}

		findJointByName(sName: string): IJoint {
			for (var s in this._pJointMap) {
				if (this._pJointMap[s].name === sName) {
					return this._pJointMap[s];
				}
			}

			return null;
		}

		attachMesh(pMesh: IMesh): bool {
			if (isNull(this.root)) {
				return false;
			}

		    if (this._pMeshNode == null) {
		    	this._pMeshNode = this.root.scene.createModel();
		    	this._pMeshNode.setInheritance(ENodeInheritance.ALL);
		    	this._pMeshNode.attachToParent(this.root);
		    }

		    this._pMeshNode.name = this.name + "[mesh-container]";
		    this._pMeshNode.mesh = (pMesh);

		    return true;
		}

		detachMesh(): void {
			//TODO: write detach method.
		}
	}

	export function createSkeleton(sName: string = null): ISkeleton {
		return new Skeleton(sName);
	}
}

#endif