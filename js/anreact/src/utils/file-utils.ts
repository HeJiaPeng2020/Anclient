/** Utils for anclient/js
 * @module anclient.js.utils
 */

// import { regex } from './regex';
//
// function FileClient () {
// 	/**Init a file upload client control.
// 	 * see https://codepen.io/matt-west/pen/CfilG
// 	 * @param {string} fileInput id of the html file fileInput
// 	 * @param {string} prevuId preview div id
// 	 * @param {regex} ftype file type regex, default: /image.* /
// 	 */
// 	this.init = function(fileInput, prevuId, ftype) {
// 		var fileInput = document.getElementById(regex.desharp_(fileInput));
// 		var fileDisplayArea = document.getElementById(prevuId);
//
// 		fileInput.addEventListener('change', function(e) {
// 			// { name: "a2.png", lastModified: 1553155518000, webkitRelativePath: "", size: 151541, type: "image/png" }
// 			fileclient.file = fileInput.files[0];
//
// 			// var imageType = /image.*/;
// 			var imageType = ftype === undefined ? /image.*/ : ftype;
//
// 			if (fileclient.file.type.match(imageType)) {
// 				var reader = new FileReader();
//
// 				reader.onload = function(e) {
// 					fileDisplayArea.innerHTML = "";
//
// 					var img = new Image();
// 					img.src = reader.result;
// 					img.classList.add('preview');
//
// 					fileDisplayArea.appendChild(img);
// 				}
// 				reader.readAsDataURL(fileclient.file);
// 			} else {
// 				fileDisplayArea.innerHTML = "File not supported!"
// 			}
// 		});
// 	};
//
// 	this.getFiles64 = function(onok) {
// 		var freader = new FileReader();
// 		// e: ProgressEvent
// 		freader.onload = function (e) {
// 			// console.log(e, freader.result);
// 			var b64 = fileclient.Uint8ToBase64(new Uint8Array(freader.result));
// 			if (typeof onok === 'function') {
// 				onok(fileclient.file, b64);
// 			}
// 		}
// 		if (fileclient.file) {
// 			freader.readAsArrayBuffer(fileclient.file);
// 		}
// 	}
//
// 	this.Uint8ToBase64 = function (u8Arr){
// 	  // var CHUNK_SIZE = 0x8000; //arbitrary number
// 	  // Common Multiple of 6 and 8 should result in 0 padding in the middle?
// 	  // a smaller size for test: var CHUNK_SIZE = 0x8 * 0x6;
// 	  var CHUNK_SIZE = 0x8 * 0x6 * 0x8 * 0x6 * 0x8 * 0x6; //110592
// 	  var index = 0;
// 	  var length = u8Arr.length;
// 	  var result = '';
// 	  var slice;
// 	  while (index < length) {
// 	    slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
// 	    result += String.fromCharCode.apply(null, slice);
// 	    index += CHUNK_SIZE;
// 	  }
// 	  return btoa(result);
// 	};
// }
// const fileClient = new FileClient;
// export { fileClient, FileClient };

/**
 * @param {array} u8arr uint8 array, e.g. file reader's read result.
 * @param {string} [mime] data url prefix,
 * "data:[<mediatype>][;base64]," for data, including ending comma,
 * e.g. "data:image/png;utf8;base64,".
 * See mime type index: https://www.iana.org/assignments/media-types/media-types.xhtml#image
 * @return {string} base64
 */
export function uarr2Base64 (u8Arr, mime) {
	// console.log(e, freader.result);
	// var CHUNK_SIZE = 0x8000; //arbitrary number
	// Common Multiple of 6 and 8 should result in 0 padding in the middle?
	// a smaller size for test: var CHUNK_SIZE = 0x8 * 0x6;
	var CHUNK_SIZE = 0x8 * 0x6 * 0x8 * 0x6 * 0x8 * 0x6; //110592
	var index = 0;
	var length = u8Arr.length;
	var result = mime || '';
	var slice;
	while (index < length) {
		slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
		result += String.fromCharCode.apply(null, slice);
		index += CHUNK_SIZE;
	}
	return btoa(result);
}

export function dataOfurl(dataUrl) {
	if (dataUrl && dataUrl.startsWith('data:'))
		return dataUrl.substring( dataUrl.indexOf(',') + 1 );
	else return dataUrl;
}

export function mimeOf(dataUrl) {
	if (dataUrl && dataUrl.startsWith('data:'))
		return dataUrl.substring( 5, dataUrl.indexOf(',') );
	else return undefined;
}

export function urlOfdata(mime, data) {
	return ['data:' + mime, data].join(',');
}