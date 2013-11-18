/// <reference path="../idl/AIEntity.ts" />
/// <reference path="../idl/AIExplorerFunc.ts" />

import ReferenceCounter = require("util/ReferenceCounter");
import logger = require("logger");
import bf = require("bitflags");

enum AEEntityStates {
    //обновился ли сам узел?
    k_Updated = 0x01,
    //есть ли среди потомков обновленные узлы
    k_DescendantsUpdtated = 0x02,
    //если ли обновленные узлы среди братьев или их потомках
    k_SiblingsUpdated = 0x04
}

class Entity extends ReferenceCounter implements AIEntity {
    protected _sName: string = null;
    protected _pParent: AIEntity = null;
    protected _pSibling: AIEntity = null;
    protected _pChild: AIEntity = null;
    protected _eType: AEEntityTypes = AEEntityTypes.UNKNOWN;
    protected _iStateFlags: int = 0;

    get name(): string { return this._sName; }
    set name(sName: string) { this._sName = sName; }

    get parent(): AIEntity { return this._pParent; }
    set parent(pParent: AIEntity) { this.attachToParent(pParent); }

    get sibling(): AIEntity { return this._pSibling; }
    set sibling(pSibling: AIEntity) { this._pSibling = pSibling; }

    get child(): AIEntity { return this._pChild; }
    set child(pChild: AIEntity) { this._pChild = pChild; }

    get type(): AEEntityTypes { return this._eType; }

    get rightSibling(): AIEntity {
        var pSibling: AIEntity = this.sibling;

        if (pSibling) {
            while (pSibling.sibling) {
                pSibling = pSibling.sibling;
            }

            return pSibling;
        }

        return this;
    }

    constructor(eType: AEEntityTypes) {
        super();
        this._eType = eType;
    }

    get depth(): int {
        var iDepth: int = -1;
        for (var pEntity: AIEntity = this; pEntity; pEntity = pEntity.parent, ++iDepth) { };
        return iDepth;
    }

    get root(): AIEntity {
        for (var pEntity: AIEntity = this, iDepth: int = -1; pEntity.parent; pEntity = pEntity.parent, ++iDepth) { };
        return pEntity;
    }



    destroy(bRecursive: boolean = false, bPromoteChildren: boolean = true): void {
        if (bRecursive) {
            if (this._pSibling) {
                this._pSibling.destroy(true);
            }

            if (this._pChild) {
                this._pChild.destroy(true);
            }
        }

        // destroy anything attached to this node
        //	destroySceneObject();
        // promote any children up to our parent
        if (bPromoteChildren && !bRecursive) {
            this.promoteChildren();
        }
        // now remove ourselves from our parent
        this.detachFromParent();
        // we should now be removed from the tree, and have no dependants
        logger.presume(this.referenceCount() == 0, "Attempting to delete a scene node which is still in use");
        logger.presume(this._pSibling == null, "Failure Destroying Node");
        logger.presume(this._pChild == null, "Failure Destroying Node");
    }

    findEntity(sName: string): AIEntity {
        var pEntity: AIEntity = null;

        if (this._sName === sName) {
            return this;
        }

        if (this._pSibling) {
            pEntity = this._pSibling.findEntity(sName);
        }

        if (pEntity == null && this._pChild) {
            pEntity = this._pChild.findEntity(sName);
        }

        return pEntity;
    }

    explore(fn: AIExplorerFunc): void {
        if (fn(this) === false) {
            return;
        }

        if (this._pSibling) {
            this._pSibling.explore(fn);
        }

        if (this._pChild) {
            this._pChild.explore(fn);
        }
    }


    childOf(pParent: AIEntity): boolean {
        for (var pEntity: AIEntity = this; pEntity; pEntity = pEntity.parent) {
            if (pEntity.parent === pParent) {
                return true;
            }
        }

        return false;
    }

    children(): AIEntity[] {
        var pChildren: AIEntity[] = [];
        var pChild: AIEntity = this.child;

        while (!isNull(pChild)) {
            pChildren.push(pChild);
            pChild = pChild.sibling;
        }

        return pChildren;
    }

    childAt(i: int): AIEntity {
        var pChild: AIEntity = this.child;
        var n: int = 0;

        while (!isNull(pChild)) {
            if (n == i) {
                return pChild;
            }
            n++;
            pChild = pChild.sibling;
        }

        return pChild;
    }

    /**
     * Returns the current number of siblings of this object.
     */
    siblingCount(): uint {
        var iCount: uint = 0;

        if (this._pParent) {
            var pNextSibling = this._pParent.child;
            if (pNextSibling) {
                while (pNextSibling) {
                    pNextSibling = pNextSibling.sibling;
                    ++iCount;
                }
            }
        }

        return iCount;
    }


    descCount(): uint {
        var n: uint = this.childCount();
        var pChild: AIEntity = this.child;

        while (!isNull(pChild)) {
            n += pChild.descCount();
            pChild = pChild.sibling;
        }

        return n;
    }

    /**
     * Returns the current number of children of this object
     */
    childCount(): uint {
        var iCount: uint = 0;
        var pChild: AIEntity = this.child;

        while (!isNull(pChild)) {
            iCount++;
            pChild = pChild.sibling;
        }

        // var pNextChild: AIEntity = this.child;

        // if (pNextChild) {
        //	 ++ iCount;
        //	 while (pNextChild) {
        //		 pNextChild = pNextChild.sibling;
        //		 ++ iCount;
        //	 }
        // }
        return iCount;
    }

    isUpdated(): boolean {
        return bf.testAll(this._iStateFlags, AEEntityStates.k_Updated);
    }

    hasUpdatedSubNodes(): boolean {
        return bf.testAll(this._iStateFlags, AEEntityStates.k_DescendantsUpdtated);
    }

    recursiveUpdate(): boolean {
        // var bUpdated: boolean = false;
        // update myself
        if (this.update()) {
            bf.setAll(this._iStateFlags, AEEntityStates.k_Updated);
            // bUpdated = true;
        }
        // update my sibling
        if (this._pSibling && this._pSibling.recursiveUpdate()) {
            bf.setAll(this._iStateFlags, AEEntityStates.k_SiblingsUpdated);
            // bUpdated = true;
        }
        // update my child
        if (this._pChild && this._pChild.recursiveUpdate()) {
            bf.setAll(this._iStateFlags, AEEntityStates.k_DescendantsUpdtated);
            // bUpdated = true;
        }

        return (this._iStateFlags != 0);/*bUpdated */
    }

    recursivePreUpdate(): void {
        // clear the flags from the previous update
        this.prepareForUpdate();

        // update my sibling
        if (this._pSibling) {
            this._pSibling.recursivePreUpdate();
        }
        // update my child
        if (this._pChild) {
            this._pChild.recursivePreUpdate();
        }
    }


    prepareForUpdate(): void {
        this._iStateFlags = 0;
    }

    /** Parent is not undef */
    hasParent(): boolean {
        return isDefAndNotNull(this._pParent);
    }

    /** Child is not undef*/
    hasChild(): boolean {
        return isDefAndNotNull(this._pChild);
    }

    /** Sibling is not undef */
    hasSibling(): boolean {
        return isDefAndNotNull(this._pSibling);
    }

    /**
     * Checks to see if the provided item is a sibling of this object
     */
    isASibling(pSibling: AIEntity): boolean {
        if (!pSibling) {
            return false;
        }
        // if the sibling we are looking for is me, or my FirstSibling, return true
        if (this == pSibling || this._pSibling == pSibling) {
            return true;
        }
        // if we have a sibling, continue searching
        if (this._pSibling) {
            return this._pSibling.isASibling(pSibling);
        }
        // it's not us, and we have no sibling to check. This is not a sibling of ours.
        return false;
    }

    /** Checks to see if the provided item is a child of this object. (one branch depth only) */
    isAChild(pChild: AIEntity): boolean {
        if (!pChild) {
            return (false);
        }
        // if the sibling we are looking for is my FirstChild return true
        if (this._pChild == pChild) {
            return (true);
        }
        // if we have a child, continue searching
        if (this._pChild) {
            return (this._pChild.isASibling(pChild));
        }
        // it's not us, and we have no child to check. This is not a sibling of ours.
        return (false);
    }

    /**
     * Checks to see if the provided item is a child or sibling of this object. If SearchEntireTree
     * is TRUE, the check is done recursivly through all siblings and children. SearchEntireTree
     * is FALSE by default.
     */
    isInFamily(pEntity: AIEntity, bSearchEntireTree?: boolean): boolean {
        if (!pEntity) {
            return (false);
        }
        // if the model we are looking for is me or my immediate family, return true
        if (this == pEntity || this._pChild == pEntity || this._pSibling == pEntity) {
            return (true);
        }
        // if not set to seach entire tree, just check my siblings and kids
        if (!bSearchEntireTree) {
            if (this.isASibling(pEntity)) {
                return (true);
            }
            if (this._pChild && this._pChild.isASibling(pEntity)) {
                return (true);
            }
        }
        // seach entire Tree!!!
        else {
            if (this._pSibling && this._pSibling.isInFamily(pEntity, bSearchEntireTree)) {
                return (true);
            }

            if (this._pChild && this._pChild.isInFamily(pEntity, bSearchEntireTree)) {
                return (true);
            }
        }

        return (false);
    }

    /**
     * Adds the provided ModelSpace object to the descendant list of this object. The provided
     * ModelSpace object is removed from any parent it may already belong to.
     */
    addSibling(pSibling: AIEntity): AIEntity {
        if (pSibling) {
            // replace objects current sibling pointer with this new one
            pSibling.sibling = this._pSibling;
            this.sibling = pSibling;
        }

        return pSibling;
    }

    /**
     * Adds the provided ModelSpace object to the descendant list of this object. The provided
     * ModelSpace object is removed from any parent it may already belong to.
     */
    addChild(pChild: AIEntity): AIEntity {
        if (pChild) {
            // Replace the new child's sibling pointer with our old first child.
            pChild.sibling = this._pChild;
            // the new child becomes our first child pointer.
            this._pChild = pChild;
            this.childAdded(pChild);
        }

        return pChild;
    }

    /**
     * Removes a specified child object from this parent object. If the child is not the
     * FirstChild of this object, all of the Children are searched to find the object to remove.
     */
    removeChild(pChild: AIEntity): AIEntity {
        if (this._pChild && pChild) {
            if (this._pChild == pChild) {
                this._pChild = pChild.sibling;
                pChild.sibling = null;
            }
            else {
                var pTempNode: AIEntity = this._pChild;
                // keep searching until we find the node who's sibling is our target
                // or we reach the end of the sibling chain
                while (pTempNode && (pTempNode.sibling != pChild)) {
                    pTempNode = pTempNode.sibling;
                }
                // if we found the proper item, set it's FirstSibling to be the FirstSibling of the child
                // we are removing
                if (pTempNode) {
                    pTempNode.sibling = pChild.sibling;
                    pChild.sibling = null;
                }
            }

            this.childRemoved(pChild);
        }

        return pChild;
    }

    /** Removes all Children from this parent object */
    removeAllChildren(): void {
        // keep removing children until end of chain is reached
        while (!isNull(this._pChild)) {
            var pNextSibling = this._pChild.sibling;
            this._pChild.detachFromParent();
            this._pChild = pNextSibling;
        }
    }

    /** Attaches this object ot a new parent. Same as calling the parent's addChild() routine. */
    attachToParent(pParent: AIEntity): boolean {

        var pParentPrev: AIEntity = this.parent;

        if (pParent != this._pParent) {

            this.detachFromParent();

            if (pParent) {
                if (pParent.addChild(this)) {
                    this._pParent = pParent;
                    this._pParent.addRef();
                    this.attached();
                    return true;
                }

                return this.attachToParent(pParentPrev);
            }
        }

        return false;
    }

    detachFromParent(): boolean {
        // tell our current parent to release us
        if (this._pParent) {
            this._pParent.removeChild(this);
            //TODO: разобраться что за херня!!!!
            if (this._pParent) {
                this._pParent.release();
            }

            this._pParent = null;
            // my world matrix is now my local matrix
            this.detached();
            return true;
        }

        return false;
    }

    /**
     * Attaches this object's children to it's parent, promoting them up the tree
     */
    promoteChildren(): void {
        // Do I have any children to promote?
        while (!isNull(this._pChild)) {
            var pNextSibling: AIEntity = this._pChild.sibling;
            this._pChild.attachToParent(this._pParent);
            this._pChild = pNextSibling;
        }
    }

    relocateChildren(pParent: AIEntity): void {
        if (pParent != this) {
            // Do I have any children to relocate?
            while (!isNull(this._pChild)) {
                var pNextSibling: AIEntity = this._pChild.sibling;
                this._pChild.attachToParent(pParent);
                this._pChild = pNextSibling;
            }
        }
    }

    update(): boolean { return false; }

    toString(isRecursive: boolean = false, iDepth: int = 0): string {
        if (has("DEBUG")) {
            if (!isRecursive) {
                return '<entity' + (this._sName ? ' ' + this._sName : "") + '>';
            }

            var pChild: AIEntity = this.child;
            var s: string = "";

            for (var i = 0; i < iDepth; ++i) {
                s += ':  ';
            }

            s += '+----[depth: ' + this.depth + ']' + this.toString() + '\n';

            if (pChild) {
                s += pChild.toString(true, iDepth + 1);
            }

            return s;

        }

        return null;

    }

		//CREATE_EVENT_TABLE(Entity);

		//UNICAST(attached, VOID);
		//UNICAST(detached, VOID);
		//UNICAST(childAdded, CALL(child));
		//UNICAST(childRemoved, CALL(child));
	}
}

