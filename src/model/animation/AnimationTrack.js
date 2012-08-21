function AnimationTrack (sTarget) {
	/**
	 * Bone name or Node name
	 * @type {String}
	 */
	this._sTarget = sTarget || null;

	/**
	 * Bone or scene hierarchy node.
	 * @type {Node}
	 */
	this.pTarget = null;

	/**
	 * Animation key frames.
	 * @type {AnimationFrame}
	 */
	this._pKeyFrames = [];
}

PROPERTY(AnimationTrack, 'targetName',
	function () {
		return this.nodeName;
	});

PROPERTY(AnimationTrack, 'target',
	function () {
		return this.pTarget;
	});

/**
 * Target name of animation track.
 */
PROPERTY(AnimationTrack, 'nodeName',
	/**
	 * Get target's name.
	 * @return {[type]} [description]
	 */
	function () {
		return this._sTarget;
	},
	/**
	 * Set bone name or node name.
	 * @param  {String} sValue Name.
	 */
	function (sValue) {
		this._sTarget = sValue;
	});

PROPERTY(AnimationTrack, 'duration',
	function () {
		return this._pKeyFrames.last.fTime;
	});

/**
 * Add key frame in {fTime}.
 */
AnimationTrack.prototype.keyFrame = function (fTime, pMatrix) {
    'use strict';
    
    var pFrame;
    var iFrame;

    var pKeyFrames = this._pKeyFrames;
  	var nTotalFrames = pKeyFrames.length;

  	if (arguments.length == 2) {
  		pFrame = new a.AnimationFrame(fTime, pMatrix);
  	}
    else {
    	pFrame = arguments[0];
    }

    if (nTotalFrames && (iFrame = this.findKeyFrame(pFrame.fTime)) >= 0) {
		pKeyFrames.splice(iFrame, 0, pFrame);
	}
	else {
		pKeyFrames.push(pFrame);
	}

	return true;
};

AnimationTrack.prototype.getKeyFrame = function (iFrame) {
    'use strict';
    
    debug_assert(iFrame < this._pKeyFrames.length, 'iFrame must be less then number of total jey frames.');

	return this._pKeyFrames[iFrame];
};

AnimationTrack.prototype.findKeyFrame = function (fTime) {
    'use strict';
    
    var pKeyFrames	= this._pKeyFrames;
    var nTotalFrames = pKeyFrames.length;
	
	if (pKeyFrames[nTotalFrames - 1].fTime == fTime) {
		return nTotalFrames - 1;
	}
	else {
		for (var i = nTotalFrames - 1; i >= 0; i--) {
			if (pKeyFrames[i].fTime > fTime && pKeyFrames[i - 1].fTime <= fTime) {
				return i - 1;
			}
		}
	}

	return -1;
};

AnimationTrack.prototype.addTranslation = function () {
    'use strict';
    
	if (arguments.length == 2) {
		var fTime = arguments[0];
		var pTranslation = arguments[1];
		var pFrame = new a.AnimationFrame(fTime);


	}

	if (arguments.length == 1) {
		var pTranslation = arguments[0];

	}
};

/**
 * Bind track to target.
 * @return {Boolean}
 */
AnimationTrack.prototype.bind = function () {
    'use strict';
    
	var pNode = null,
		pRootNode;

	var pSkeleton;
	var sJoint;

	switch (arguments.length) {
		case 2:
			//bind by pair <String joint, Skeleton skeleton>
			sJoint = arguments[0];
			pSkeleton = arguments[1];

			this._sTarget = sJoint;
			pNode = pSkeleton.findJoint(sJoint);
			break;
		default:
			//bind by <Skeleton skeleton>
			if (arguments[0] instanceof a.Skeleton) {
				
				if (this._sTarget == null) {
					return false;
				}

				pSkeleton = arguments[0];
				pNode = pSkeleton.findJoint(this._sTarget);
			}
			//bind by <Node node>
			else if (arguments[0] instanceof a.Node) {
				pRootNode = arguments[0];
				pNode = pRootNode.findNode(this._sTarget);
			}
	}
	
	this.pTarget = pNode;

	return pNode? true: false;
};

AnimationTrack.prototype.frame = function (fTime) {
    'use strict';

	var iKey1, iKey2;
	var fScalar;
	var fTimeDiff;
	var pKeys = this._pKeyFrames
	var nKeys = pKeys.length;
	var pFrame = a.AnimationFrame();

	//TODO: реализовать существенно более эффективный поиск кадра.
	for (var i = 0; i < nKeys; i ++) {
    	if (fTime >= this._pKeyFrames[i].fTime) {
            iKey1 = i;
        }
    }

    iKey2 = (iKey1 >= (nKeys - 1))? iKey1 : iKey1 + 1;
    fTimeDiff = pKeys[iKey2].fTime - pKeys[iKey1].fTime;
    
    if (!fTimeDiff)
        fTimeDiff = 1;
	
	fScalar = (fTime - pKeys[iKey1].fTime) / fTimeDiff;
	
	AnimationTrack.interpolate(
		this._pKeyFrames[iKey1], 
		this._pKeyFrames[iKey2], 
		pFrame, 
		fScalar);

	pFrame.fTime = fTime;
	pFrame.fWeight = 1.0;

	return pFrame;
};

AnimationTrack.interpolate = function (pStartFrame, pEndFrame, pResultFrame, fBlend) {
    'use strict';
    
    var pStartData, pEndData, pData;
    var fBlendInv = 1. - fBlend;

    if (pStartFrame.pMatrix) {
    	
    	pStartData = pStartFrame.pMatrix.pData;
    	pEndData = pEndFrame.pMatrix.pData;
    	pData = pResultFrame.pMatrix.pData;

		for (var i = 0; i < 16; i++) {
			pData[i] = fBlend * pEndData[i] + fBlendInv * pStartData;
		};

		return;
	}
	
	if (pStartFrame.v3fTranslation) {
		pStartData = pStartFrame.v3fTranslation.pData;
		pEndData = pEndFrame.v3fTranslation.pData;
		pData = pResultFrame.v3fTranslation.pData;

		pData.X = fBlend * pEndData.X + fBlendInv * pStartData.X;
		pData.Y = fBlend * pEndData.Y + fBlendInv * pStartData.Y;
		pData.Z = fBlend * pEndData.Z + fBlendInv * pStartData.Z;
	}

	if (pStartFrame.v3fScale) {
		pStartData = pStartFrame.v3fScale.pData;
		pEndData = pEndFrame.v3fScale.pData;
		pData = pResultFrame.v3fScale.pData;

		pData.X = fBlend * pEndData.X + fBlendInv * pStartData.X;
		pData.Y = fBlend * pEndData.Y + fBlendInv * pStartData.Y;
		pData.Z = fBlend * pEndData.Z + fBlendInv * pStartData.Z;
	}
	
	if (pStartFrame.qRotation) {
		pStartFrame.qRotation.slerp(pEndFrame.qRotation, fBlend, pResultFrame.qRotation);
	}
};

A_NAMESPACE(AnimationTrack);


