#ifndef UTIL_DEPTH_RANGE
#define UTIL_DEPTH_RANGE

#include "render/Viewport.ts"
#include "webgl/WebGLRenderer.ts"
#include "webgl/WebGLInternalTexture.ts"

module akra.util{

// #ifdef WEBGL
// #define WEBGL_DEPTH_RANGE 1
// #endif

#ifdef WEBGL_DEPTH_RANGE

	var sFloatToVec4Func: string = "\
        	vec4 floatToVec4(float value){						\n\
				float data = value;								\n\
				vec4 result = vec4(0.);							\n\
																\n\
				if(data == 0.){									\n\
					float signedZeroTest = 1./value;			\n\
					if(signedZeroTest < 0.){					\n\
						result.x = 128.;						\n\
					}											\n\
					return result/255.;							\n\
				}												\n\
																\n\
				if(data < 0.){									\n\
					result.x=128.;								\n\
					data = -data;								\n\
				}												\n\
																\n\
				float power = 0.;								\n\
				bool isFinish = false;							\n\
																\n\
				for(int i = 0; i < 128; i++) {					\n\
				  if(isFinish){									\n\
				    break;										\n\
				  }												\n\
																\n\
				  if(data >= 2.) {								\n\
				    if(!isFinish){								\n\
				      data = data * 0.5;						\n\
				      power += 1.;								\n\
				      if (power == 127.) {						\n\
				        isFinish = true;						\n\
				      }											\n\
				    }											\n\
				  }												\n\
				  else if(data < 1.) {							\n\
				    if(!isFinish){								\n\
				      data = data * 2.;							\n\
				      power -= 1.;								\n\
				      if (power == -126.) {						\n\
				        isFinish = true;						\n\
				      }											\n\
				    }											\n\
				  }												\n\
				  else {										\n\
				    isFinish = true;							\n\
				  }												\n\
				}												\n\
																\n\
				if(power == -126. && data < 1.){				\n\
					power = 0.;									\n\
				}												\n\
				else{											\n\
					power = power+127.;							\n\
					data = data - 1.;							\n\
				}												\n\
																\n\
				result.x+=floor(power/2.);						\n\
				result.y = mod(power,2.)*128.;					\n\
																\n\
				data *= 128.;									\n\
																\n\
				result.y += floor(data);						\n\
																\n\
				data -= floor(data);							\n\
				data *= 256.;									\n\
																\n\
				result.z = floor(data);							\n\
																\n\
				data -= floor(data);							\n\
				data *= 256.;									\n\
																\n\
				result.w = floor(data);							\n\
																\n\
				return result/255.;								\n\
			}													\n";

	var sPixelCode: string = "										\n\
				#ifdef GL_ES                        				\n\
				    precision highp float;          				\n\
				#endif												\n\
				varying vec2 texPosition;              				\n\
																	\n\
				uniform sampler2D srcTexture;						\n\
				uniform vec2 halfSrcTexureStep;						\n\
				uniform int selector;								\n\
																	\n\
				" + sFloatToVec4Func + 	"							\n\
																	\n\
				void main(void) {  									\n\
					if(selector == 0){								\n\
						float depth_NW = texture2D(srcTexture, texPosition + vec2(-halfSrcTexureStep.x, halfSrcTexureStep.y)).x;	\n\
						float depth_NE = texture2D(srcTexture, texPosition + vec2(halfSrcTexureStep.x, halfSrcTexureStep.y)).x;		\n\
						float depth_SW = texture2D(srcTexture, texPosition + vec2(-halfSrcTexureStep.x, -halfSrcTexureStep.y)).x;	\n\
						float depth_SE = texture2D(srcTexture, texPosition + vec2(halfSrcTexureStep.x, -halfSrcTexureStep.y)).x;	\n\
																																	\n\
						float fMaxDepth = -1.;														\n\
						float fMinDepth = min(depth_NW, min(depth_NE, min(depth_SW, depth_SE)));	\n\
																									\n\
						if(depth_NW != 1.){ //clear Depth value										\n\
							fMaxDepth = max(fMaxDepth, depth_NW);									\n\
						}																			\n\
						if(depth_NE != 1.){ //clear Depth value										\n\
							fMaxDepth = max(fMaxDepth, depth_NE);									\n\
						}																			\n\
						if(depth_SW != 1.){ //clear Depth value										\n\
							fMaxDepth = max(fMaxDepth, depth_SW);									\n\
						}																			\n\
						if(depth_SE != 1.){ //clear Depth value										\n\
							fMaxDepth = max(fMaxDepth, depth_SE);									\n\
						}																			\n\
																									\n\
						if(fMaxDepth == -1.){														\n\
							fMaxDepth = 1.;															\n\
						}																			\n\
																									\n\
						gl_FragColor = vec4(fMaxDepth, fMinDepth, 0., 1.);							\n\
					}																				\n\
					else if(selector == 1){															\n\
						vec2 depth_NW = texture2D(srcTexture, texPosition + vec2(-halfSrcTexureStep.x, halfSrcTexureStep.y)).xy;	\n\
						vec2 depth_NE = texture2D(srcTexture, texPosition + vec2(halfSrcTexureStep.x, halfSrcTexureStep.y)).xy;		\n\
						vec2 depth_SW = texture2D(srcTexture, texPosition + vec2(-halfSrcTexureStep.x, -halfSrcTexureStep.y)).xy;	\n\
						vec2 depth_SE = texture2D(srcTexture, texPosition + vec2(halfSrcTexureStep.x, -halfSrcTexureStep.y)).xy;	\n\
																																	\n\
						//x - max depth 																							\n\
						//y - min depth 																							\n\
																																	\n\
						float fMaxDepth = -1.;																						\n\
						float fMinDepth = min(depth_NW.y, min(depth_NE.y, min(depth_SW.y, depth_SE.y)));							\n\
																																	\n\
						if(depth_NW.x != 1.){ //clear Depth value																	\n\
							fMaxDepth = max(fMaxDepth, depth_NW.x);																	\n\
						}																											\n\
						if(depth_NE.x != 1.){ //clear Depth value																	\n\
							fMaxDepth = max(fMaxDepth, depth_NE.x);																	\n\
						}																											\n\
						if(depth_SW.x != 1.){ //clear Depth value																	\n\
							fMaxDepth = max(fMaxDepth, depth_SW.x);																	\n\
						}																											\n\
						if(depth_SE.x != 1.){ //clear Depth value																	\n\
							fMaxDepth = max(fMaxDepth, depth_SE.x);																	\n\
						}																											\n\
																																	\n\
						if(fMaxDepth == -1.){																						\n\
							fMaxDepth = 1.;																							\n\
						}																											\n\
																																	\n\
						gl_FragColor = vec4(fMaxDepth, fMinDepth, 0., 1.);															\n\
					}																												\n\
					else{																											\n\
						// 1x1 float texture with depth to two point with decomposed float 											\n\
						vec2 depth = texture2D(srcTexture, vec2(0.5, 0.5)).xy;														\n\
						if(texPosition.x < 0.5){																					\n\
							//first pixel																							\n\
							vec4 value = floatToVec4(depth.x);																		\n\
							gl_FragColor = vec4(value.w, value.b, value.g, value.r);												\n\
						}																											\n\
						else{																										\n\
							//second pixel																							\n\
							vec4 value = floatToVec4(depth.y);																		\n\
							gl_FragColor = vec4(value.w, value.b, value.g, value.r);												\n\
						}																											\n\
					}																												\n\
				}                                   																				\n\
				";

	var sVertexCode: string = "																						\n\
	        	attribute vec2 POSITION;																			\n\
				                      																				\n\
				varying vec2 texPosition;																			\n\
				                   																					\n\
				void main(void){																					\n\
				    texPosition = (POSITION + 1.)/2.;																\n\
				    gl_Position = vec4(POSITION, 0., 1.);															\n\
				}																									\n\
				";

	var pF32ScreenCoords: Float32Array = new Float32Array([-1,-1, -1,1, 1,-1, 1,1]);
	var pU8Destination: Uint8Array = new Uint8Array(8);
	var pF32Destination: Float32Array = new Float32Array(pU8Destination.buffer);

	export function getDepthRange(pDepthTexture: ITexture): IDepthRange{
		var pEngine: IEngine = pDepthTexture.getEngine();
		var pResourceManager: IResourcePoolManager = pEngine.getResourceManager();
		var pWebGLRenderer: webgl.WebGLRenderer = <webgl.WebGLRenderer>pEngine.getRenderer();
		var pWebGLContext: WebGLRenderingContext = pWebGLRenderer.getWebGLContext();

		var pWebGLDepthTexture: WebGLTexture = (<webgl.WebGLInternalTexture>pDepthTexture).getWebGLTexture();

		var pWebGLProgram: webgl.WebGLShaderProgram = <webgl.WebGLShaderProgram><IShaderProgram>pResourceManager.
														shaderProgramPool.findResource(".WEBGL_depth_range");
		

		if(isNull(pWebGLProgram)){
			pWebGLProgram = <webgl.WebGLShaderProgram><IShaderProgram>pResourceManager.
														shaderProgramPool.createResource(".WEBGL_depth_range");

			pWebGLProgram.create(sVertexCode, sPixelCode);
		}

		var pOldFrameBuffer: WebGLFramebuffer = pWebGLRenderer.getParameter(GL_FRAMEBUFFER_BINDING);

        var pWebGLFramebuffer: WebGLFramebuffer = pWebGLRenderer.createWebGLFramebuffer();

        pWebGLRenderer.disableAllWebGLVertexAttribs();

        pWebGLRenderer.bindWebGLFramebuffer(GL_FRAMEBUFFER, pWebGLFramebuffer);
        pWebGLRenderer.useWebGLProgram(pWebGLProgram.getWebGLProgram());

        pWebGLContext.disable(GL_DEPTH_TEST);
        pWebGLContext.disable(GL_SCISSOR_TEST);
        pWebGLContext.disable(GL_BLEND);
        pWebGLContext.disable(GL_CULL_FACE);

        var iPositionAttribLocation: uint = pWebGLProgram.getWebGLAttributeLocation("POSITION");

        pWebGLContext.enableVertexAttribArray(iPositionAttribLocation);

        var pPositionBuffer: WebGLBuffer = pWebGLContext.createBuffer();
        pWebGLRenderer.bindWebGLBuffer(GL_ARRAY_BUFFER, pPositionBuffer);
        pWebGLContext.bufferData(GL_ARRAY_BUFFER, pF32ScreenCoords, GL_STATIC_DRAW);
        pWebGLContext.vertexAttribPointer(iPositionAttribLocation, 2, GL_FLOAT, false, 0, 0);

        var iSrcTextureSizeX: uint = pDepthTexture.width;
        var iSrcTextureSizeY: uint = pDepthTexture.height;

        var pWebGLTexture1: WebGLTexture = pWebGLContext.createTexture();
        var pWebGLTexture2: WebGLTexture = pWebGLContext.createTexture();

        var pWebGLRenderTexture: WebGLTexture = pWebGLTexture1;
        var pWebGLSrcTexture: WebGLTexture = pWebGLDepthTexture;

        var iSelector: uint = 0;

        var iRenderTextureSizeX: uint = 0;
        var iRenderTextureSizeY: uint = 0;

        if(iSrcTextureSizeX == 1 && iSrcTextureSizeY == 1){
        	iSelector = 2;

        	iRenderTextureSizeX = 2;
        	iRenderTextureSizeY = 1;
        	
        	pWebGLRenderer.activateWebGLTexture(GL_TEXTURE0);
        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLRenderTexture);

        	pWebGLContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 
				    	2, 1, 0,  GL_RGBA, GL_UNSIGNED_BYTE, null);
        }
        else{
        	iSelector = 0;

        	iRenderTextureSizeX = math.pow(2, math.floor(math.log(iSrcTextureSizeX)/math.log(2)));
        	iRenderTextureSizeY = math.pow(2, math.floor(math.log(iSrcTextureSizeY)/math.log(2)));

        	if(iRenderTextureSizeX == iSrcTextureSizeX){
        		iRenderTextureSizeX = iSrcTextureSizeX/2;
        	}
        	if(iRenderTextureSizeY == iSrcTextureSizeY){
        		iRenderTextureSizeY = iSrcTextureSizeY/2;
        	}

        	if(iRenderTextureSizeX > iRenderTextureSizeY){
        		iRenderTextureSizeY = iRenderTextureSizeX;
        	}
        	else{
        		iRenderTextureSizeX = iRenderTextureSizeY;
        	}

        	pWebGLRenderer.activateWebGLTexture(GL_TEXTURE0);
        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLRenderTexture);

        	pWebGLContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 
				    	iRenderTextureSizeX, iRenderTextureSizeY, 0,  GL_RGBA, GL_FLOAT, null);
        }

        do {

        	pWebGLRenderer.activateWebGLTexture(GL_TEXTURE1);
        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLRenderTexture);
        	pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        	pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        	pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        	pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

        	pWebGLContext.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, 
        		GL_TEXTURE_2D, pWebGLRenderTexture, 0);

        	pWebGLRenderer.activateWebGLTexture(GL_TEXTURE0);
        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLSrcTexture);

        	pWebGLProgram.setInt("selector", iSelector);
        	pWebGLProgram.setInt("srcTexture", 0);
        	pWebGLProgram.setVec2("halfSrcTexureStep", vec2(0.5/iSrcTextureSizeX, 0.5/iSrcTextureSizeY));

        	pWebGLContext.viewport(0, 0, iRenderTextureSizeX, iRenderTextureSizeY);

        	pWebGLContext.drawArrays(GL_TRIANGLE_STRIP, 0, 4);

        	if(iSelector == 2){
        		break;
        	}
	
    		iSelector = 1;

    		if(iRenderTextureSizeX === 1 && iRenderTextureSizeY === 1){
    			iSelector = 2;

    			iRenderTextureSizeX = 2;
    			iRenderTextureSizeY = 1;

    			pWebGLSrcTexture = pWebGLRenderTexture;

    			pWebGLRenderTexture = (pWebGLRenderTexture === pWebGLTexture1) ? pWebGLTexture2 : pWebGLTexture1;

	        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLRenderTexture);

	        	pWebGLContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 
				    	iRenderTextureSizeX, iRenderTextureSizeY, 0,  GL_RGBA, GL_UNSIGNED_BYTE, null);
    		}
    		else{
    			iSrcTextureSizeX = iRenderTextureSizeX;
    			iSrcTextureSizeY = iRenderTextureSizeY;

    			iRenderTextureSizeX = iSrcTextureSizeX/2;
    			iRenderTextureSizeY = iSrcTextureSizeY/2;

    			pWebGLSrcTexture = pWebGLRenderTexture;

    			pWebGLRenderTexture = (pWebGLRenderTexture === pWebGLTexture1) ? pWebGLTexture2 : pWebGLTexture1;

	        	pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLRenderTexture);

	        	pWebGLContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 
				    	iRenderTextureSizeX, iRenderTextureSizeY, 0,  GL_RGBA, GL_FLOAT, null);
    		}

    	} while(1);

    	

    	pWebGLContext.readPixels(0, 0, 2, 1, GL_RGBA, GL_UNSIGNED_BYTE, pU8Destination);

    	// pWebGLRenderer.activateWebGLTexture(GL_TEXTURE2);
    	// pWebGLRenderer.bindWebGLTexture(GL_TEXTURE_2D, pWebGLTexture1);
    	// pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    	// pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    	// pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    	// pWebGLContext.texParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    	// pWebGLContext.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 
			  //   				 pDepthTexture.width, pDepthTexture.height, 0, GL_RGBA, GL_UNSIGNED_BYTE, null);


    	// pWebGLRenderer.bindWebGLFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, pWebGLTexture1, 0);
    	// pWebGLRenderer.bindWebGLFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, (<any>pDepthTexture).getWebGLTexture(), 0);

    	// var pDepthRange = pWebGLContext.getParameter(GL_DEPTH_RANGE);
    	// pWebGLRenderer.bindWebGLFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, null, 0);


    	pWebGLRenderer.bindWebGLFramebuffer(GL_FRAMEBUFFER, pOldFrameBuffer);
        pWebGLRenderer.deleteWebGLFramebuffer(pWebGLFramebuffer);

        pWebGLContext.disableVertexAttribArray(iPositionAttribLocation);
        pWebGLContext.deleteBuffer(pPositionBuffer);
        pWebGLContext.deleteTexture(pWebGLTexture1);
        pWebGLContext.deleteTexture(pWebGLTexture2);

        pWebGLContext.enable(GL_DEPTH_TEST);
        // pWebGLContext.disable(GL_SCISSOR_TEST);
        // pWebGLContext.disable(GL_BLEND);
        // pWebGLContext.disable(GL_CULL_FACE);

        pWebGLRenderer.bindWebGLBuffer(GL_ARRAY_BUFFER, null);
        pWebGLRenderer._setViewport(null);
        // console.log("depth range:", pF32Destination[1], pF32Destination[0]);

		return <IDepthRange>{min: pF32Destination[1], max: pF32Destination[0]};
	}

	#else
	export function getDepthRange(pDepthTexture: ITexture): IDepthRange{
		return <IDepthRange>{min: 0., max: 1.};
	};
	#endif
	
}

#endif