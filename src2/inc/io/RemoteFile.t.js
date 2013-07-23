function base64_encode (data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}

// var EFileBinaryType = {
//     ARRAY_BUFFER: 0x01,
//     BLOB        : 0x02,
//     OBJECT_URL  : 0x03  
// }

function read (pFile) {
    try {
        var pXhr = new XMLHttpRequest();
        var pData = null;

        pXhr.open('GET', pFile.name, false);
        // pXhr.onprogress = 

        if (isBinary(pFile.mode)) {
            pXhr.overrideMimeType('application/octet-stream');
            pXhr.responseType = 'arraybuffer';
        }
        else if (isJSON(pFile.mode) && pFile.pos === 0) {
            pXhr.overrideMimeType('application/json');
            pXhr.responseType = 'json';
        }
        else if (isURL(pFile.mode)) {
            pXhr.responseType = 'blob';
        }
        else {
            pXhr.responseType = 'text';
        }

        
        pXhr.send();

        if (parseInt(pXhr.status) != 200 && parseInt(pXhr.status) != 0) {
            throw pXhr.status;
        }

        pData = pXhr.response;
        
        if (pFile.pos > 0) {
            pData = pData.slice(pFile.pos);

            if (isJSON(pFile.mode)) {
                pData = JSON.parse(pData);
            }
        }

        if (isURL(pFile.mode)) {
            pData = URL.createObjectURL(pData);
        }

        pXhr = null;

        return pData;
    }
    catch (e) {
        throw e;
    }
}

function todo () {
    throw new Error('This functionality is not implemented for remote files.');
}

function remove (pFile) {
    todo();
    /*var pXhr = send(pFile, {action: 'remove'});
     throw new Error(pXhr.responseText);
     return false;*/
}
function open (pFile) {
}

function queryString (pObj, sPrefix) {
    if (typeof pObj == 'string') {
        return pObj;
    }

    var str = [];
    for (var p in pObj) {
        var k = sPrefix ? sPrefix + "[" + p + "]" : p, v = pObj[p];
        str.push(typeof v == "object" ?
                     a.queryString(v, k) :
                     encodeURIComponent(k) + "=" + encodeURIComponent(v));
    }

    return str.join("&");
}

function buf2str (pBuffer) {
    pBuffer = new Uint8Array(pBuffer);
    var sString = '', c;
    for (var n = 0; n < pBuffer.length; ++n) {
        c = String.fromCharCode(pBuffer[n]);
        sString += c;
    }
    return sString;
}

function str2buf (s) {
    var len = s.length;
    var pArr = new Uint8Array(len);
    for (var i = 0; i < len; ++i) {
        pArr[ i ] = s.charCodeAt(i) & 0xFF;
    }

    return pArr.buffer;
}

function write (pFile, pData, sContentType) {
    var pQuery = {}
    pQuery['action'] = 'write';
    
    if (typeof pData == 'object') {
        pData = buf2str(pData);
    }

    if (isBinary(pFile.mode)) {
        pData = base64_encode(pData);
        pQuery['encode'] = 'base64';
    }

    pQuery['data'] = pData;
    pQuery['pos'] = pFile.pos;
    pQuery['content-type'] = sContentType;

    send(pFile, pQuery);
}

function send (pFile, pQuery) {
    var pXhr = new XMLHttpRequest();
    pXhr.open('POST', pFile.name, true);
    pXhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
    pXhr.send(queryString(pQuery));
    return pXhr;
}

function clear (pFile) {
    todo();
}

function meta (pFile) {
    var pXhr = new XMLHttpRequest();

    pXhr.open('HEAD', pFile.name, false);
    pXhr.send(null);
    
    if (pXhr.status == 200) {
        return {
            size: parseInt(pXhr.getResponseHeader('Content-Length')),
            lastModifiedDate: pXhr.getResponseHeader('Last-Modified') || null,

            eTag: pXhr.getResponseHeader('ETag') || null,
        };
    }

    return {};
}

function file (pCmd) {
    return {};
}


importScripts('FileInterface.t.js');