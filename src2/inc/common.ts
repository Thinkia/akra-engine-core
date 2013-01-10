#ifndef COMMON_TS
#define COMMON_TS


#define int number
#define uint number
#define float number
#define double number
#define long number

#define IFACE(IF) export interface IF {}
#define readonly  
#define protected
#define struct class
#define const var
#define DEBUG DEBUG
#define WEBGL 1


#include "ILogger.ts"

#define UNKNOWN_CODE 0
#define UNKONWN_MESSAGE "Unknown code."

#ifdef LOGGER_API

#define LOG(...)            logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.log(__VA_ARGS__);
#define TRACE(...)          logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.log(__VA_ARGS__);
#define INFO(...)           logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.info(__VA_ARGS__);
#define WARNING(...)        logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.warning(__VA_ARGS__);
#define ERROR(...)          logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.error(__VA_ARGS__);
#define CRITICAL(...)       logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.critical_error(__VA_ARGS__);
#define CRITICAL_ERROR(...) logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.critical_error(__VA_ARGS__);
#define ASSERT(...)         logger.setSourceLocation(__FILE__, __LINE__); \
                            logger.assert(__VA_ARGS__);

#else

#define LOG(...)
#define TRACE(...)
#define INFO(...)
#define WARNING(...)
#define ERROR(...)
#define CRITICAL(...)
#define CRITICAL_ERROR(...) 
#define ASSERT(...)

#endif

#define ALLOCATE_STORAGE(sName, nCount)    \
        static get stackCeil(): I ## sName { \
            sName.stackPosition = sName.stackPosition === sName.stackSize - 1? 0: sName.stackPosition;\
            return sName.stack[sName.stackPosition ++]; \
        }\
        static stackSize: uint = nCount;\
        static stackPosition: int = 0;\
        static stack: I ## sName[] = (function(): I ## sName[]{\
                                    var pStack: I ## sName[] = new Array(sName.stackSize);\
                                    for(var i:int = 0; i<sName.stackSize; i++){\
                                        pStack[i] = new sName();\
                                    }\
                                    return pStack})();

module akra {

#ifdef DEBUG
    export var DEBUG: bool = true;
#else
    export var DEBUG: bool = false;
#endif

    export var logger: ILogger;
    export var typeOf: (x: any) => string;

    typeOf = function typeOf(x: any): string {
        var s: string = typeof x;

        if (s === "object") {
            if (x) {

                if (x instanceof Array) {
                    return 'array';
                } else if (x instanceof Object) {
                    return s;
                }

                var sClassName = Object.prototype.toString.call(x);

                if (sClassName == '[object Window]') {
                    return 'object';
                }

                if ((sClassName == '[object Array]' ||
                     typeof x.length == 'number' &&
                     typeof x.splice != 'undefined' &&
                     typeof x.propertyIsEnumerable != 'undefined' &&
                     !x.propertyIsEnumerable('splice')

                    )) {
                    return 'array';
                }

                if ((sClassName == '[object Function]' ||
                    typeof x.call != 'undefined' &&
                    typeof x.propertyIsEnumerable != 'undefined' &&
                    !x.propertyIsEnumerable('call'))) {
                    return 'function';
                }

            } else {
                return 'null';
            }

        } else if (s == 'function' && typeof x.call == 'undefined') {
            return 'object';
        }
        return s;
    };


    /** @inline */
    export var isDef = (x: any): bool =>  x !== undefined;
    /** @inline */
    export var isEmpty = (x: any): bool =>  x.length == 0;

    // Note that undefined == null.
    /** @inline */ 
    export var isDefAndNotNull = (x: any): bool =>  x != null;

    /** @inline */
    export var isNull = (x: any): bool =>  x === null;

    /** @inline */
    export var isBoolean = (x: any): bool => typeof x === "boolean";

	/** @inline */
    export var isString = (x: any): bool => typeof x === "string";

    /** @inline */
    export var isNumber = (x: any): bool => typeof x === "number";
    /** @inline */
    export var isFloat = isNumber;
    /** @inline */
    export var isInt = isNumber;

    /** @inline */
    export var isFunction = (x: any): bool => typeOf(x) === "function";

    /** @inline */
    export var isObject = (x: any): bool => {
        var type = typeOf(x);
        return type == "object" || type == "array" || type == "function";
    };

    export var isArrayBuffer = (x: any): bool => x instanceof ArrayBuffer;

    export var isTypedArray = (x: any): bool => typeof x === "object" && typeof x.byteOffset === "number";

    /** @inline */
    export var isArray = (x: any): bool => {
        return typeOf(x) == "array";
    };    

    export interface Pair {
        first: any;
        second: any;
    };

    // if (!isDef(console.assert)) {
    //     console.assert = function (isOK?: bool, ...pParams: any[]): void {
    //         if (!isOK) {
    //             trace('---------------------------');
    //             trace.apply(null, pParams);
    //             throw new Error("[assertion failed]");
    //         }
    //     }
    // }

    // export var trace = console.log.bind(console);
    // export var assert = console.assert.bind(console);
    // export var warning = console.warn.bind(console);
    // export var error = console.error.bind(console); 


#ifdef DEBUG

    #define debug_assert(...)     ASSERT(__VA_ARGS__)
    #define debug_print(...)      LOG(__VA_ARGS__)
    #define debug_warning(...)    WARNING(__VA_ARGS__)
    #define debug_error(...)      ERROR(__VA_ARGS__)

    // export var debug_print = (pArg:any, ...pParams: any[]): void => {
    //         trace.apply(null, arguments);
    // }

    // export var debug_assert = (isOK: bool, ...pParams: any[]): void => {
    //         assert.apply(null, arguments);
    // }
    
    // export var debug_warning = (pArg:any, ...pParams: any[]): void => {
    //         warning.apply(null, arguments);
    // }

    // export var debug_error = (pArg:any, ...pParams: any[]): void => {
    //         error.apply(null, arguments);
    // }

#else

#define debug_print(...)
#define debug_assert(...)
#define debug_warning(...)
#define debug_error(...)

#endif


    export function genArray(pType: any, nSize: uint) {
        var tmp = new Array(nSize);

        for (var i: int = 0; i < nSize; ++i) {
            tmp[i] = (pType? new pType: null);
        }

        return tmp;
    }


    export const INVALID_INDEX: int =  0xffff;

    // (-2147483646);
    export const MIN_INT32: int = 0xffffffff;  
    // ( 2147483647);
    export const MAX_INT32: int = 0x7fffffff; 
    // (-32768);
    export const MIN_INT16: int = 0xffff;    
    // ( 32767);  
    export const MAX_INT16: int = 0x7fff;      
    // (-128);
    export const MIN_INT8: int = 0xff; 
    // ( 127);        
    export const MAX_INT8: int = 0x7f;         
    export const MIN_UINT32: int = 0;
    export const MAX_UINT32: int = 0xffffffff;
    export const MIN_UINT16: int = 0;
    export const MAX_UINT16: int = 0xffff;
    export const MIN_UINT8: int = 0;
    export const MAX_UINT8: int = 0xff;


    export const SIZE_FLOAT64: int = 8;
    export const SIZE_REAL64: int = 8;
    export const SIZE_FLOAT32: int = 4;
    export const SIZE_REAL32: int = 4;
    export const SIZE_INT32: int = 4;
    export const SIZE_UINT32: int = 4;
    export const SIZE_INT16: int = 2;
    export const SIZE_UINT16: int = 2;
    export const SIZE_INT8: int = 1;
    export const SIZE_UINT8: int = 1;
    export const SIZE_BYTE: int = 1;
    export const SIZE_UBYTE: int = 1;

    //1.7976931348623157e+308
    export const MAX_FLOAT64: float = Number.MAX_VALUE;      
    //-1.7976931348623157e+308
    export const MIN_FLOAT64: float = -Number.MAX_VALUE;     
    //5e-324
    export const TINY_FLOAT64: float = Number.MIN_VALUE;     

//    export const MAX_REAL64: number = Number.MAX_VALUE;   //1.7976931348623157e+308
//    export const MIN_REAL64: number = -Number.MAX_VALUE;  //-1.7976931348623157e+308
//    export const TINY_REAL64: number = Number.MIN_VALUE;  //5e-324


    //3.4e38
    export const MAX_FLOAT32: float = 3.4e38;    
    //-3.4e38
    export const MIN_FLOAT32: float = -3.4e38;
    //1.5e-45  
    export const TINY_FLOAT32: float = 1.5e-45;  

//    export const MAX_REAL32: number = 3.4e38;     //3.4e38
//    export const MIN_REAL32: number = -3.4e38;    //-3.4e38
//    export const TINY_REAL32: number = 1.5e-45;   //1.5e-45

    export const DEFAULT_MATERIAL_NAME: string = "default";

    export enum EDataTypes {
        BYTE = 0x1400,
        UNSIGNED_BYTE = 0x1401,
        SHORT = 0x1402,
        UNSIGNED_SHORT = 0x1403,
        INT = 0x1404,
        UNSIGNED_INT = 0x1405,
        FLOAT = 0x1406
    };

    export enum EDataTypeSizes {
        BYTES_PER_BYTE = 1,
        BYTES_PER_UNSIGNED_BYTE = 1,
        BYTES_PER_UBYTE = 1,

        BYTES_PER_SHORT = 2,
        BYTES_PER_UNSIGNED_SHORT = 2,
        BYTES_PER_USHORT = 2,

        BYTES_PER_INT = 4,
        BYTES_PER_UNSIGNED_INT = 4,
        BYTES_PER_UINT = 4,

        BYTES_PER_FLOAT = 4
    };

/*
    export enum EResourceTypes {
        SURFACE = 1,
        VOLUME,
        TEXTURE,   
        VOLUMETEXTURE,
        CUBETEXTURE,
        VERTEXBUFFER,
        INDEXBUFFER,
        FORCE_DWORD = 0x7fffffff
    };

*/

    export interface StringMap {
        [index: string]: string;
        [index: number]: string;
    };

    export interface IntMap {
        [index: string]: int;
        [index: number]: int;
    };    

    export interface UintMap {
        [index: string]: uint;
        [index: number]: uint;
    };  

    export interface FloatMap {
        [index: string]: float;
        [index: number]: float;
    };    

    export interface BoolMap {
        [index: string]: bool;
        [index: number]: bool;
    };        

    export interface BoolDMap{
        [index: string]: BoolMap;
        [index: number]: BoolMap;
    };

    export interface StringDMap{
        [index: string]: StringMap;
        [index: number]: StringMap;
    }

    /**
     * Возвращет размер типа в байтах
     **/
    //export function getTypeSize(eType: EImageTypes): uint;
    export function getTypeSize(eType: EDataTypes): uint;
    export function getTypeSize(eType): uint {
        switch (eType) {
            case EDataTypes.BYTE:
            case EDataTypes.UNSIGNED_BYTE:
                return 1;
            case EDataTypes.SHORT:
            case EDataTypes.UNSIGNED_SHORT:
            //case EImageTypes.UNSIGNED_SHORT_4_4_4_4:
            //case EImageTypes.UNSIGNED_SHORT_5_5_5_1:
            //case EImageTypes.UNSIGNED_SHORT_5_6_5:
                return 2;
            case EDataTypes.INT:
            case EDataTypes.UNSIGNED_INT:
            case EDataTypes.FLOAT:
                return 4;
            default:
                ERROR('unknown data/image type used');
        }

        return 0;
    }

    
    export var sid = (): uint => (++ sid._iTotal);
    sid._iTotal = 0;


    export function now(): uint {
        return (new Date).getTime();
    }


    
    #define _memcpy(dst, src, size) memcpy(dst, 0, src, 0, size);
    export inline function memcpy(pDst: ArrayBuffer, iDstOffset: uint, pSrc: ArrayBuffer, iSrcOffset: uint, nLength: uint) {
      var dstU8 = new Uint8Array(pDst, iDstOffset, nLength);
      var srcU8 = new Uint8Array(pSrc, iSrcOffset, nLength);
      dstU8.set(srcU8);
    };


    //export function 

	(<any>window).URL = (<any>window).URL ? (<any>window).URL : (<any>window).webkitURL ? (<any>window).webkitURL : null;
	(<any>window).BlobBuilder = (<any>window).WebKitBlobBuilder || (<any>window).MozBlobBuilder || (<any>window).BlobBuilder;
	(<any>window).requestFileSystem = (<any>window).requestFileSystem || (<any>window).webkitRequestFileSystem;
	(<any>window).requestAnimationFrame = (<any>window).requestAnimationFrame || (<any>window).webkitRequestAnimationFrame ||
		(<any>window).mozRequestAnimationFrame;
	(<any>window).WebSocket = (<any>window).WebSocket || (<any>window).MozWebSocket;
    (<any>window).storageInfo = (<any>window).storageInfo || (<any>window).webkitStorageInfo;
    Worker.prototype.postMessage = (<any>Worker).prototype.webkitPostMessage || Worker.prototype.postMessage;
};

#ifdef LOGGER_API
#define "util/Logger.ts"
#endif

#endif