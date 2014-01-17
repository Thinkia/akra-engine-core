﻿/// <reference path="../idl/ILogger.ts" />
/// <reference path="../common.ts" />
/// <reference path="../bf/bf.ts" />
/// <reference path="../util/Singleton.ts" />

module akra.util {
	interface ILogRoutineMap {
		[eLogLevel: uint]: ILogRoutineFunc;
	}

	interface AICodeFamily {
		familyName: string;
		codeMin: uint;
		codeMax: uint;
	}

	interface AICodeFamilyMap {
		[familyName: string]: AICodeFamily;
	}

	interface AICodeInfo {
		code: uint;
		message: string;
		familyName: string;
	}

	interface AICodeInfoMap {
		[code: uint]: AICodeInfo;
	}

	interface AICodeFamilyRoutineDMap {
		[familyName: string]: ILogRoutineMap;
	}

	final export class Logger extends util.Singleton<Logger> implements ILogger {
		private _eLogLevel: ELogLevel;
		private _pGeneralRoutineMap: ILogRoutineMap;

		private _pCurrentSourceLocation: ISourceLocation;
		private _pLastLogEntity: ILoggerEntity;

		private _pCodeFamilyList: AICodeFamily[];
		private _pCodeFamilyMap: AICodeFamilyMap;
		private _pCodeInfoMap: AICodeInfoMap;

		private _pCodeFamilyRoutineDMap: AICodeFamilyRoutineDMap;

		private _nFamilyGenerator: uint;

		private static _sDefaultFamilyName: string = "CodeFamily";

		private _eUnknownCode: uint;
		private _sUnknownMessage: string;

		constructor() {
			super();

			this._eUnknownCode = 0;
			this._sUnknownMessage = "Unknown code";

			this._eLogLevel = ELogLevel.ALL;
			this._pGeneralRoutineMap = <ILogRoutineMap>{};

			this._pCurrentSourceLocation = <ISourceLocation>{
				file: "",
				line: 0
			};

			this._pLastLogEntity = <ILoggerEntity>{
				code: this._eUnknownCode,
				location: this._pCurrentSourceLocation,
				message: this._sUnknownMessage,
				info: null,
			};

			this._pCodeFamilyMap = <AICodeFamilyMap>{};
			this._pCodeFamilyList = <AICodeFamily[]>[];
			this._pCodeInfoMap = <AICodeInfoMap>{};

			this._pCodeFamilyRoutineDMap = <AICodeFamilyRoutineDMap>{};

			this._nFamilyGenerator = 0;
		}

		init(): boolean {
			//TODO: Load file
			return true;
		}

		setLogLevel(eLevel: ELogLevel): void {
			this._eLogLevel = eLevel;
		}

		getLogLevel(): ELogLevel {
			return this._eLogLevel;
		}

		registerCode(eCode: uint, sMessage: string = this._sUnknownMessage): boolean {
			if (this.isUsedCode(eCode)) {
				return false;
			}

			var sFamilyName: string = this.getFamilyName(eCode);
			if (isNull(sFamilyName)) {
				return false;
			}

			var pCodeInfo: AICodeInfo = <AICodeInfo>{
				code: eCode,
				message: sMessage,
				familyName: sFamilyName
			};

			this._pCodeInfoMap[eCode] = pCodeInfo;

			return true;
		}

		setUnknownCode(eCode: uint, sMessage: string): void {
			this._eUnknownCode = eCode;
			this._sUnknownMessage = sMessage;
		}

		registerCodeFamily(eCodeMin: uint, eCodeMax: uint, sFamilyName: string = this.generateFamilyName()): boolean {
			if (this.isUsedFamilyName(sFamilyName)) {
				return false;
			}

			if (!this.isValidCodeInterval(eCodeMin, eCodeMax)) {
				return false;
			}

			var pCodeFamily: AICodeFamily = <AICodeFamily>{
				familyName: sFamilyName,
				codeMin: eCodeMin,
				codeMax: eCodeMax
			};

			this._pCodeFamilyMap[sFamilyName] = pCodeFamily;
			this._pCodeFamilyList.push(pCodeFamily);

			return true;
		}

		getFamilyName(eCode): string {
			var i: uint = 0;
			var pCodeFamilyList: AICodeFamily[] = this._pCodeFamilyList;
			var pCodeFamily: AICodeFamily;

			for (i = 0; i < pCodeFamilyList.length; i++) {
				pCodeFamily = pCodeFamilyList[i];

				if (pCodeFamily.codeMin <= eCode && pCodeFamily.codeMax >= eCode) {
					return pCodeFamily.familyName;
				}
			}

			return "";
		}

		setCodeFamilyRoutine(eCodeFromFamily: uint, fnLogRoutine: ILogRoutineFunc, eLevel: uint): boolean;
		setCodeFamilyRoutine(sFamilyName: string, fnLogRoutine: ILogRoutineFunc, eLevel: uint): boolean;
		setCodeFamilyRoutine(): boolean {
			var sFamilyName: string = "";
			var fnLogRoutine: ILogRoutineFunc = null;
			var eLevel: ELogLevel = ELogLevel.LOG;

			if (isInt(arguments[0])) {
				sFamilyName = this.getFamilyName(arguments[0]);
				fnLogRoutine = arguments[1];
				eLevel = arguments[2];

				if (sFamilyName === "") {
					return false;
				}
			}
			else if (isString(arguments[0])) {
				sFamilyName = arguments[0];
				fnLogRoutine = arguments[1];
				eLevel = arguments[2];
			}

			if (!this.isUsedFamilyName(sFamilyName)) {
				return false;
			}

			var pCodeFamilyRoutineMap: ILogRoutineMap = this._pCodeFamilyRoutineDMap[sFamilyName];

			if (!isDef(pCodeFamilyRoutineMap)) {
				pCodeFamilyRoutineMap = this._pCodeFamilyRoutineDMap[sFamilyName] = <ILogRoutineMap>{};
			}

			if (bf.testAll(eLevel, ELogLevel.LOG)) {
				pCodeFamilyRoutineMap[ELogLevel.LOG] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.INFORMATION)) {
				pCodeFamilyRoutineMap[ELogLevel.INFORMATION] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.WARNING)) {
				pCodeFamilyRoutineMap[ELogLevel.WARNING] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.ERROR)) {
				pCodeFamilyRoutineMap[ELogLevel.ERROR] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.CRITICAL)) {
				pCodeFamilyRoutineMap[ELogLevel.CRITICAL] = fnLogRoutine;
			}

			return true;
		}

		setLogRoutine(fnLogRoutine: ILogRoutineFunc, eLevel: uint): void {
			if (bf.testAll(eLevel, ELogLevel.LOG)) {
				this._pGeneralRoutineMap[ELogLevel.LOG] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.INFORMATION)) {
				this._pGeneralRoutineMap[ELogLevel.INFORMATION] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.WARNING)) {
				this._pGeneralRoutineMap[ELogLevel.WARNING] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.ERROR)) {
				this._pGeneralRoutineMap[ELogLevel.ERROR] = fnLogRoutine;
			}
			if (bf.testAll(eLevel, ELogLevel.CRITICAL)) {
				this._pGeneralRoutineMap[ELogLevel.CRITICAL] = fnLogRoutine;
			}
		}

		setSourceLocation(sFile: string, iLine: uint): void;
		setSourceLocation(pLocation: ISourceLocation): void;
		setSourceLocation(): void {
			var sFile: string;
			var iLine: uint;

			if (arguments.length === 2) {
				sFile = arguments[0];
				iLine = arguments[1];
			}
			else {
				if (isDef(arguments[0]) && !(isNull(arguments[0]))) {
					sFile = arguments[0].file;
					iLine = arguments[0].line;
				}
				else {
					sFile = "";
					iLine = 0;
				}
			}

			this._pCurrentSourceLocation.file = sFile;
			this._pCurrentSourceLocation.line = iLine;
		}

		log(...pArgs: any[]): void {
			if (!bf.testAll(this._eLogLevel, ELogLevel.LOG)) {
				return;
			}

			var fnLogRoutine: ILogRoutineFunc = this._pGeneralRoutineMap[ELogLevel.LOG];
			if (!isDef(fnLogRoutine)) {
				return;
			}

			var pLogEntity: ILoggerEntity = this._pLastLogEntity;

			pLogEntity.code = this._eUnknownCode;
			pLogEntity.location = this._pCurrentSourceLocation;
			pLogEntity.info = pArgs;
			pLogEntity.message = this._sUnknownMessage;

			fnLogRoutine.call(null, pLogEntity);
		}

		info(pEntity: ILoggerEntity): void;
		info(eCode: uint, ...pArgs: any[]): void;
		info(...pArgs: any[]): void;
		info(): void {
			if (!bf.testAll(this._eLogLevel, ELogLevel.INFORMATION)) {
				return;
			}

			var pLogEntity: ILoggerEntity;
			var fnLogRoutine: ILogRoutineFunc;

			pLogEntity = this.prepareLogEntity.apply(this, arguments);
			fnLogRoutine = this.getCodeRoutineFunc(pLogEntity.code, ELogLevel.INFORMATION);

			if (isNull(fnLogRoutine)) {
				return;
			}

			fnLogRoutine.call(null, pLogEntity);
		}

		warn(pEntity: ILoggerEntity): void;
		warn(eCode: uint, ...pArgs: any[]): void;
		warn(...pArgs: any[]): void;
		warn(): void {
			if (!bf.testAll(this._eLogLevel, ELogLevel.WARNING)) {
				return;
			}

			var pLogEntity: ILoggerEntity;
			var fnLogRoutine: ILogRoutineFunc;

			pLogEntity = this.prepareLogEntity.apply(this, arguments);
			fnLogRoutine = this.getCodeRoutineFunc(pLogEntity.code, ELogLevel.WARNING);

			if (isNull(fnLogRoutine)) {
				return;
			}

			fnLogRoutine.call(null, pLogEntity);
		}

		error(pEntity: ILoggerEntity): void;
		error(eCode: uint, ...pArgs: any[]): void;
		error(...pArgs: any[]): void;
		error(): void {
			if (!bf.testAll(this._eLogLevel, ELogLevel.ERROR)) {
				return;
			}

			var pLogEntity: ILoggerEntity;
			var fnLogRoutine: ILogRoutineFunc;

			pLogEntity = this.prepareLogEntity.apply(this, arguments);
			fnLogRoutine = this.getCodeRoutineFunc(pLogEntity.code, ELogLevel.ERROR);

			if (isNull(fnLogRoutine)) {
				return;
			}

			fnLogRoutine.call(null, pLogEntity);
		}

		critical(pEntity: ILoggerEntity): void;
		critical(eCode: uint, ...pArgs: any[]): void;
		critical(...pArgs: any[]): void;
		critical(): void {
			var pLogEntity: ILoggerEntity;
			var fnLogRoutine: ILogRoutineFunc;

			pLogEntity = this.prepareLogEntity.apply(this, arguments);
			fnLogRoutine = this.getCodeRoutineFunc(pLogEntity.code, ELogLevel.CRITICAL);

			var sSystemMessage: string = "A Critical error has occured! Code: " + pLogEntity.code.toString();

			if (bf.testAll(this._eLogLevel, ELogLevel.CRITICAL) && !isNull(fnLogRoutine)) {
				fnLogRoutine.call(null, pLogEntity);
			}

			alert(sSystemMessage);
			throw new Error(sSystemMessage);
		}

		assert(bCondition: boolean, pEntity: ILoggerEntity): void;
		assert(bCondition: boolean, eCode: uint, ...pArgs: any[]): void;
		assert(bCondition: boolean, ...pArgs: any[]): void;
		assert(): void {
			var bCondition: boolean = <boolean> arguments[0];

			if (!bCondition) {
				var pLogEntity: ILoggerEntity;
				var fnLogRoutine: ILogRoutineFunc;

				var pArgs: any[] = [];

				for (var i = 1; i < arguments.length; i++) {
					pArgs[i - 1] = arguments[i];
				}

				pLogEntity = this.prepareLogEntity.apply(this, pArgs);
				fnLogRoutine = this.getCodeRoutineFunc(pLogEntity.code, ELogLevel.CRITICAL);

				var sSystemMessage: string = "A error has occured! Code: " + pLogEntity.code.toString() +
					"\n Accept to exit, refuse to continue.";

				if (bf.testAll(this._eLogLevel, ELogLevel.CRITICAL) && !isNull(fnLogRoutine)) {
					fnLogRoutine.call(null, pLogEntity);
				}

				if (confirm(sSystemMessage)) {
					throw new Error(sSystemMessage);
				}
			}
		}

		presume(bCondition: boolean, pEntity: ILoggerEntity): void;
		presume(bCondition: boolean, eCode: uint, ...pArgs: any[]): void;
		presume(bCondition: boolean, ...pArgs: any[]): void;
		presume(): void {
		}

		private generateFamilyName(): string {
			var sSuffix: string = <string><any>(this._nFamilyGenerator++);
			var sName: string = Logger._sDefaultFamilyName + sSuffix;

			if (this.isUsedFamilyName(sName)) {
				return this.generateFamilyName();
			}
			else {
				return sName;
			}
		}

		private isValidCodeInterval(eCodeMin: uint, eCodeMax: uint): boolean {
			if (eCodeMin > eCodeMax) {
				return false;
			}

			var i: uint = 0;
			var pCodeFamilyList: AICodeFamily[] = this._pCodeFamilyList;
			var pCodeFamily: AICodeFamily;

			for (i = 0; i < pCodeFamilyList.length; i++) {
				pCodeFamily = pCodeFamilyList[i];

				if ((pCodeFamily.codeMin <= eCodeMin && pCodeFamily.codeMax >= eCodeMin) ||
					(pCodeFamily.codeMin <= eCodeMax && pCodeFamily.codeMax >= eCodeMax)) {
					return false;
				}
			}

			return true;
		}

		private isUsedFamilyName(sFamilyName: string): boolean {
			return isDef(this._pCodeFamilyMap[sFamilyName]);
		}

		private isUsedCode(eCode: uint): boolean {
			return isDef(this._pCodeInfoMap[eCode]);
		}

		private isLogEntity(pObj: any): boolean {
			if (isObject(pObj) && isDef(pObj.code) && isDef(pObj.location)) {
				return true;
			}

			return false;
		}

		private isLogCode(eCode: any): boolean {
			return isInt(eCode);
		}

		private prepareLogEntity(pEntity: ILoggerEntity): ILoggerEntity;
		private prepareLogEntity(eCode: uint, ...pArgs: any[]): ILoggerEntity;
		private prepareLogEntity(...pArgs: any[]): ILoggerEntity;
		private prepareLogEntity(): ILoggerEntity {
			var eCode: uint = this._eUnknownCode;
			var sMessage: string = this._sUnknownMessage;
			var pInfo: any = null;

			if (arguments.length === 1 && this.isLogEntity(arguments[0])) {
				var pEntity: ILoggerEntity = arguments[0];

				eCode = pEntity.code;
				pInfo = pEntity.info;
				this.setSourceLocation(pEntity.location);

				if (!isDef(pEntity.message)) {
					var pCodeInfo: AICodeInfo = this._pCodeInfoMap[eCode];
					if (isDef(pCodeInfo)) {
						sMessage = pCodeInfo.message;
					}
				}
			}
			else {
				if (this.isLogCode(arguments[0])) {
					eCode = <uint>arguments[0];
					if (arguments.length > 1) {
						pInfo = new Array(arguments.length - 1);
						var i: uint = 0;

						for (i = 0; i < pInfo.length; i++) {
							pInfo[i] = arguments[i + 1];
						}
					}
				}
				else {
					eCode = this._eUnknownCode;
					// if(arguments.length > 0){
					pInfo = new Array(arguments.length);
					var i: uint = 0;

					for (i = 0; i < pInfo.length; i++) {
						pInfo[i] = arguments[i];
					}
					// }
					// else {
					//     pInfo = null;
					// }
				}

				var pCodeInfo: AICodeInfo = this._pCodeInfoMap[eCode];
				if (isDef(pCodeInfo)) {
					sMessage = pCodeInfo.message;
				}
			}

			var pLogEntity: ILoggerEntity = this._pLastLogEntity;

			pLogEntity.code = eCode;
			pLogEntity.location = this._pCurrentSourceLocation;
			pLogEntity.message = sMessage;
			pLogEntity.info = pInfo;

			return pLogEntity;
		}

		private getCodeRoutineFunc(eCode: uint, eLevel: ELogLevel): ILogRoutineFunc {
			var pCodeInfo: AICodeInfo = this._pCodeInfoMap[eCode];
			var fnLogRoutine: ILogRoutineFunc;

			if (!isDef(pCodeInfo)) {
				fnLogRoutine = this._pGeneralRoutineMap[eLevel];
				return isDef(fnLogRoutine) ? fnLogRoutine : null;
			}

			var pCodeFamilyRoutineMap: ILogRoutineMap = this._pCodeFamilyRoutineDMap[pCodeInfo.familyName];

			if (!isDef(pCodeFamilyRoutineMap) || !isDef(pCodeFamilyRoutineMap[eLevel])) {
				fnLogRoutine = this._pGeneralRoutineMap[eLevel];
				return isDef(fnLogRoutine) ? fnLogRoutine : null;
			}

			fnLogRoutine = pCodeFamilyRoutineMap[eLevel];

			return fnLogRoutine;
		}
	}
}