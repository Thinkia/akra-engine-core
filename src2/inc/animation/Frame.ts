#ifndef ANIMATIONFRAME_TS
#define ANIMATIONFRAME_TS

#include "IFrame.ts"
#include "math/math.ts"

#define AF_NUM 4 * 4096

module akra.animation {
	export class Frame implements IFrame {
		type: EAnimationInterpolations;

		time: float;
		weight: float;

		constructor (eType: EAnimationInterpolations, fTime: float  = 0.0, fWeight: float = 1.0) {
			this.type = eType;
			this.time = fTime;
			this.weight = fWeight;
		}

		reset(): IFrame {
			this.weight = 0.0;
			this.time = 0.0;

			return this;
		}

		add(pFrame: IFrame, isFirst: bool): IFrame {
			debug_error("You cannot use Frame class directly.");
			return this;
		}

		set(pFrame: IFrame): IFrame {
			this.weight = pFrame.weight;
			this.time = pFrame.time;

			return this;
		}

		mult(fScalar: float): IFrame {
			this.weight *= fScalar;

			return this;
		}

		normilize(): IFrame {
			debug_error("You cannot use Frame class directly.");
			return this;
		}

		interpolate(pStartFrame: IFrame, pEndFrame: IFrame, fBlend: float): IFrame {
			debug_error("You cannot use Frame class directly.");
			return this;
		}
	}

	//complex world position frame
	export class PositionFrame extends Frame implements IPositionFrame {
		private matrix: IMat4 = null;
		
		rotation: IQuat4 = new Quat4;
		scale: IVec3 = new Vec3;
		translation: IVec3 = new Vec3;

		constructor();
		constructor(fTime: float, pMatrix: IMat4);
		constructor(fTime: float, pMatrix: IMat4, fWeight: float);
		constructor(fTime?: float, pMatrix?: IMat4, fWeight?: float) {
			super(EAnimationInterpolations.SPHERICAL);

			switch (arguments.length) {		
				case 0:
					this.matrix = new Mat4;
					return;
				case 3:
					this.weight = fWeight;
				case 2:
					this.matrix = pMatrix;
				case 1:
					this.time = fTime;
			};

			ASSERT(this.matrix.decompose(this.rotation, this.scale, this.translation), "could not decompose matrix");
		}

		toMatrix(): IMat4 {
			return this.rotation.toMat4(this.matrix).setTranslation(this.translation).scaleRight(this.scale);
		}

		reset(): IPositionFrame {
			super.reset();

			this.rotation.x = this.rotation.y = this.rotation.z = 0;
			this.rotation.w = 1.0;

			this.translation.x = this.translation.y = this.translation.z = 0;

			this.scale.x = this.scale.y = this.scale.z = 0;

			return this;
		}

		set(pFrame: IPositionFrame): IPositionFrame {
			super.set(pFrame);

			this.rotation.set(pFrame.rotation);
			this.scale.set(pFrame.scale);
			this.translation.set(pFrame.translation);

			return this;
		}

		/**
		 * Adding frame data with own weight.
		 * @note Frame must be normilized after this modification!
		 */
		add(pFrame: IPositionFrame, isFirst: bool): IPositionFrame {
			var fWeight: float = pFrame.weight;

			//only lerp supported
			this.scale.x += pFrame.scale.x * fWeight;
			this.scale.y += pFrame.scale.y * fWeight;
			this.scale.z += pFrame.scale.z * fWeight;

			//only lerp supported
			this.translation.x += pFrame.translation.x * fWeight; 
			this.translation.y += pFrame.translation.y * fWeight;
			this.translation.z += pFrame.translation.z * fWeight;

			this.weight += fWeight;

			if (isFirst) {
				this.rotation.set(pFrame.rotation);
				return this;
			}

			switch (this.type) {
				case EAnimationInterpolations.LINEAR:
					this.rotation.mix(pFrame.rotation, fWeight / this.weight);
					break;
				case EAnimationInterpolations.SPHERICAL:
					this.rotation.smix(pFrame.rotation, fWeight / this.weight);
					break;
			}

			return this;
		}

		normilize(): IPositionFrame {
			var fScalar: float = 1.0 / this.weight;

		    this.scale.x *= fScalar;
		    this.scale.y *= fScalar;
		    this.scale.z *= fScalar;
				
		    this.translation.x *= fScalar;
		    this.translation.y *= fScalar;
		    this.translation.z *= fScalar;

			return this;
		}


		interpolate(pStartFrame: IPositionFrame, pEndFrame: IPositionFrame, fBlend: float): IPositionFrame {
			pStartFrame.translation.mix(pEndFrame.translation, fBlend, this.translation);
			pStartFrame.scale.mix(pEndFrame.scale, fBlend, this.scale);
			
			switch (pStartFrame.type) {
				case EAnimationInterpolations.LINEAR:
					pStartFrame.rotation.mix(pEndFrame.rotation, fBlend, this.rotation);
					break;
				case EAnimationInterpolations.SPHERICAL:
					pStartFrame.rotation.smix(pEndFrame.rotation, fBlend, this.rotation);
					break;
			}

			return this;
		}

		ALLOCATE_STORAGE(PositionFrame, AF_NUM);
	} 

	export class MatrixFrame extends Frame {
		matrix: IMat4 = null;

		constructor();
		constructor(fTime: float, pMatrix: IMat4);
		constructor(fTime: float, pMatrix: IMat4, fWeight: float);
		constructor(fTime?: float, pMatrix?: IMat4, fWeight?: float) {
			super(EAnimationInterpolations.LINEAR);

			switch (arguments.length) {		
				case 0:
					this.matrix = new Mat4;
					return;
				case 3:
					this.weight = fWeight;
				case 2:
					this.matrix = pMatrix;
				case 1:
					this.time = fTime;
			};
		}

		reset(): MatrixFrame {
			super.reset();

			var pData = this.matrix.data;

			pData[__11] = pData[__12] = pData[__13] = pData[__14] = 
			pData[__21] = pData[__22] = pData[__23] = pData[__24] = 
			pData[__31] = pData[__32] = pData[__33] = pData[__34] = 
			pData[__41] = pData[__42] = pData[__43] = pData[__44] = 0;

			return this;
		}

		set(pFrame: MatrixFrame): MatrixFrame {
			super.set(pFrame);
			//FIXME: расписать побыстрее
			this.matrix.set(pFrame.matrix);

			return this;
		}

		inline toMatrix(): IMat4 {
			return this.matrix;
		}

		add(pFrame: MatrixFrame, isFirst: bool): MatrixFrame {
			var pMatData: Float32Array = pFrame.matrix.data;
			var fWeight: float = pFrame.weight;
			var pResData: Float32Array = this.matrix.data;

			for (var i = 0; i < 16; ++ i) {
				pResData[i] += pMatData[i] * fWeight;
			}

			this.weight += fWeight;
			return this;
		}

		normilize(): MatrixFrame {
			var fScalar: float = 1.0 / this.weight;
		    var pData = this.matrix.data;

		    pData[__11] *= fScalar;
		    pData[__12] *= fScalar; 
		    pData[__13] *= fScalar;
		    pData[__14] *= fScalar;
			
			pData[__21] *= fScalar;
		    pData[__22] *= fScalar; 
		    pData[__23] *= fScalar;
		    pData[__24] *= fScalar;
			
			pData[__31] *= fScalar;
		    pData[__32] *= fScalar; 
		    pData[__33] *= fScalar;
		    pData[__34] *= fScalar;
			
			pData[__41] *= fScalar;
		    pData[__42] *= fScalar; 
		    pData[__43] *= fScalar;
		    pData[__44] *= fScalar;
				
			return this;
		}

		interpolate(pStartFrame: MatrixFrame, pEndFrame: MatrixFrame, fBlend: float): MatrixFrame {
			debug_assert(this.type === EAnimationInterpolations.LINEAR, 
				"only LERP interpolation supported for matrix frames");

			var pResultData = this.matrix.data;
			var pStartData = pStartFrame.matrix.data;
			var pEndData = pEndFrame.matrix.data;
			var fBlendInv: float = 1. - fBlend;

			for (var i: int = 0; i < 16; i++) {
				pResultData[i] = pEndData[i] * fBlend + pStartData[i] * fBlendInv;
			}

			return this;
		}

		ALLOCATE_STORAGE(MatrixFrame, AF_NUM);

	}

	export inline function animationFrame(): PositionFrame {
		return PositionFrame.stackCeil;
	}
}

#endif