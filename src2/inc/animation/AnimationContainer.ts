#ifndef ANIMATIONCONTAINER_TS
#define ANIMATIONCONTAINER_TS

#include "IAnimationContainer.ts"
#include "IAnimationFrame.ts"
#include "IAnimationBase.ts"


module akra.animation {
	export class AnimationContainer extends AnimationBase implements IAnimationContainer {

		private _bEnable: bool = true;
		private _fStartTime: float = 0;
		private _fSpeed: float = 1.0;
		private _bLoop: bool = false;
		private _pAnimation: IAnimationBase = null;
		private _bReverse: bool = false;
		
		private _fTrueTime: float = 0;	//Время учитывающее циклы и прочее.
		private _fRealTime: float = 0;	//реальное время на сцене
		private _fTime: float = 0;		//время с учетом ускорений
		private _bPause: bool = false;

		//определена ли анимация до первого и после последнего кадров
		private _bLeftInfinity: bool = true;
		private _bRightInfinity: bool = true;

		constructor(pAnimation?: IAnimationBase){
			if (pAnimation) {
				this.setAnimation(pAnimation);
			}
		}

		inline get animationName(): string{
			return this._pAnimation.name;
		}

		inline get speed(): float{
			return this._fSpeed;
		}

		inline get animationTime(): float{
			return this._fTrueTime;
		}

		getTime(): float {
			return this._fTime;
		}

		play(fRealTime: float): void {
			this._fRealTime = fRealTime;
		    this._fTime = 0;

		    this.onplay(fTime);
		}

		stop(): void {
			this.onstop(this._fTime);
		}

		attach(pTarget: INode): void {
			this._pAnimation.bind(pTarget);
			this.grab(this._pAnimation, true);
		}

		setAnimation(pAnimation: IAnimationBase): void {
			debug_assert(!this._pAnimation, 'anim. already exists');

			this._pAnimation = pAnimation;
			this.setSpeed(this.speed);

			var me = this;

			/*FIX THIS*/
			CONNECT(pAnimation, SIGNAL(updateDuration), this, SLOT(setSpeed))

			/*pAnimation.on('updateDuration', function () {
				me.setSpeed(me.speed);
			});*/

			this.grab(pAnimation);
		}

		getAnimation(): IAnimationBase {
			return this._pAnimation;
		}

		enable(): void {
			this._bEnable = true;
		}

		disable(): void {
			this._bEnable = false;
		}

		isEnabled(): bool {
			return this._bEnable;
		}

		leftInfinity(bValue: bool): void {
			this._bLeftInfinity = bValue;
		}

		rightInfinity(bValue: bool): void {
			this._bRightInfinity = bValue;
		}

		setStartTime(fRealTime: float): void {
			this._fStartTime = fRealTime;
		}

		getStartTime(): float {
			return this._fStartTime;
		}

		setSpeed(fSpeed: float): void {
			this._fSpeed = fSpeed;
			this._fDuration = this._pAnimation._fDuration / fSpeed;
			
			this.onUpdateDuration();
		}

		getSpeed(): float {
			return this._fSpeed;
		}

		useLoop(bValue: bool): void {
			this._bLoop = bValue;
		}

		inLoop(): bool {
			return this._bLoop;
		}

		reverse(bValue: bool): void {
			this._bReverse = bValue;
		}

		isReversed(): bool {
			return this._bReverse;
		}

		pause(bValue: bool): void {
			this._fRealTime = -1;
			this._bPause = bValue;
		}

		rewind(fRealTime: float): void {
			this._fTime = fRealTime;
		}

		isPaused(): bool {
			return this._bPause;
		}

		time(fRealTime: float): void{
			if (this._bPause) {
		    	return;
		    }

		    if (this._fRealTime < 0) {
		    	this._fRealTime = fRealTime;
		    }

		    this._fTime = this._fTime + (fRealTime - this._fRealTime) * this._fSpeed;
		    this._fRealTime = fRealTime;

		    var fTime = this._fTime;

		    if (this._bLoop) {
		    	fTime = Math.mod(fTime, (this._pAnimation._fDuration));
		    	if (this._bReverse) {
		    		fTime = this._pAnimation._fDuration - fTime; 
		    	}
		    }

		    this._fTrueTime = fTime;
		}

		frame(sName: string, fRealTime: float): IAnimationFrame {
			if (!this._bEnable) {
		    	return null;
		    }

		    if (this._fRealTime !== fRealTime) {
		    	this.time(fRealTime);
		    	this.fire(a.Animation.EVT_ENTER_FRAME, fRealTime);
		    	//trace('--->', this.name);
		    }

		    if (!this._bLeftInfinity && this._fRealTime < this._fStartTime) {
		    	return null;
		    }

			if (!this._bRightInfinity && this._fRealTime > this._fDuration + this._fStartTime) {
		    	return null;
		    }    

			return this._pAnimation.frame(sName, this._fTrueTime);
		}


		BEGIN_EVENT_TABLE(AnimationBase);
			BROADCAST(onplay, CALL(fTime));
			BROADCAST(onstop, CALL(fTime));
			BROADCAST(onUpdateDuration, CALL());
		END_EVENT_TABLE();
	} 
}

#endif