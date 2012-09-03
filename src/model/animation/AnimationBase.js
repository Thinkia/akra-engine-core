function AnimationBase () {
	Enum([
		EVT_ENTER_FRAME = 'enterFrame',
		EVT_START = 'start',
		EVT_END = 'end'
		], ANIMATION_EVENTS, a.Animation);

	this._pTargetMap = {};
    this._pTargetList = [];
	
	this._fDuration = 0;
	this._sName = ('animation-' + a.now() + '-' + a.sid());

	this._pCallbacks = {};

	this.on(a.Animation.EVT_ENTER_FRAME, null);
	// this.on(a.Animation.EVT_START, null);
	// this.on(a.Animation.EVT_END, null);
}

A_NAMESPACE(AnimationBase);

PROPERTY(AnimationBase, 'duration',
	function () {
		return this._fDuration;
	});

PROPERTY(AnimationBase, 'name',
	function () {
		return this._sName;
	},
	function (sName) {
		this._sName = sName;
	});


AnimationBase.prototype.on = function(eEvent, fnCallback) {
	this._pCallbacks[eEvent] = fnCallback;
	//trace(eEvent, '-->', fnCallback)
};

AnimationBase.prototype.bind = function(pTarget) {
	debug_error('method AnimationBase::bind() must be overwritten.');
};

AnimationBase.prototype.frame = function (sName, fTime) {
    'use strict';
   		
 	return null;
};


AnimationBase.prototype.apply = function (fTime) {
    'use strict';
    
    var pTargetList = this._pTargetList;
    var pTarget;
    var pFrame;
    var pTransform;

	for (var i = 0; i < pTargetList.length; ++ i) {
		pFrame = this.frame(pTargetList[i].name, fTime);
		pTarget = pTargetList[i].target;

		if (!pFrame || !pTarget) {
			continue;
		}

		pTransform = pFrame.toMatrix();
		pTarget.accessLocalMatrix().set(pTransform);
	};

	var fnEnterFrame = this._pCallbacks[a.Animation.EVT_ENTER_FRAME];
	if (fnEnterFrame) {
		fnEnterFrame(fTime);
	}
};

AnimationBase.prototype.addTarget = function (sName, pTarget) {
    'use strict';
    
    pTarget = pTarget || null;

    var pPointer = this._pTargetMap[sName];

    if (pPointer) {
    	pPointer.target = pTarget || pPointer.target || null;
    	return pPointer;
    }

    pPointer = {
		target: pTarget,
		index: this._pTargetList.length,
		name: sName
	};

    this._pTargetList.push(pPointer);
	this._pTargetMap[sName] = pPointer;

	return pPointer;
};

AnimationBase.prototype.setTarget = function (sName, pTarget) {
    'use strict';

    debug_assert(pTarget, 'target with name <' + sName + '> must have a value');

    var pPointer = this._pTargetMap[sName];
	pPointer.target = pTarget;
	return pPointer;
};

AnimationBase.prototype.getTarget = function (sTarget) {
    'use strict';
    
	return this._pTargetMap[sTarget];
};

AnimationBase.prototype.targetNames = function() {
	var pTargets = this._pTargetList;
	var pTargetNames = [];

	for (var i = 0; i < pTargets.length; ++ i) { 
		pTargetNames.push(pTargets[i].name);
	}

	return pTargetNames;
};

AnimationBase.prototype.targetList = function() {
	var pTargets = this._pTargetList;
	var pTargetList = [];

	for (var i = 0; i < pTargets.length; ++ i) { 
		pTargetList.push(pTargets[i].target);
	}

	return pTargetList;
};

AnimationBase.prototype.jointList = function() {
	var pTargets = this._pTargetList;
	var pJointList = [];

	for (var i = 0; i < pTargets.length; ++ i) { 
		if (pTargets[i].target instanceof a.Joint) {
			pJointList.push(pTargets[i].target);
		}
	}

	return pJointList;
};

AnimationBase.prototype.createAnimationMask = function() {
	var pTargets = this.targetNames();
    var pMask = {};

    for (var i = 0; i < pTargets.length; ++ i) {
    	pMask[pTargets[i]] = 1.0;
    }

    return pMask;
};

AnimationBase.prototype.grab = function (pAnimationBase, bRewrite) {
    'use strict';
    
    bRewrite = ifndef(bRewrite, true);

    var pAdoptTargets = pAnimationBase._pTargetList;

	for (var i = 0; i < pAdoptTargets.length; ++ i) {
		
		if (!pAdoptTargets[i].target) {
			warning('cannot grab target <' + pAdoptTargets[i].name + '>, becaus "target" is null');
			//continue;
		}

		if (bRewrite || !this.getTarget(pAdoptTargets[i].name)) {
			this.addTarget(pAdoptTargets[i].name, pAdoptTargets[i].target);
		}
	};
};