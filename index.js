/* eslint-disable promise/prefer-await-to-then */

// Mapping for different Fullscreen API variations across browsers
const methodMap = [
  // Standard
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror',
  ],
  // New WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
  ],
  // Old WebKit
  [
    'webkitRequestFullScreen',
    'webkitCancelFullScreen',
    'webkitCurrentFullScreenElement',
    'webkitCancelFullScreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
  ],
  // Mozilla
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror',
  ],
  // Microsoft
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError',
  ],
];

// Native API detection and mapping
const nativeAPI = (() => {
  if (typeof document === 'undefined') {
    return false;
  }

  const unprefixedMethods = methodMap[0];
  const returnValue = {};

  // Loop through methodMap to find the supported fullscreen API
  for (const methodList of methodMap) {
    const exitFullscreenMethod = methodList?.[1]; // exitFullscreen or equivalent
    if (exitFullscreenMethod in document) {
      methodList.forEach((method, index) => {
        returnValue[unprefixedMethods[index]] = method;
      });
      return returnValue;
    }
  }

  return false;
})();

// Event names for fullscreen changes and errors
const eventNameMap = {
  change: nativeAPI.fullscreenchange,
  error: nativeAPI.fullscreenerror,
};

// Screenfull API implementation
let screenfull = {
  // Request fullscreen mode for the given element
  request(element = document.documentElement, options) {
    return new Promise((resolve, reject) => {
      const onFullScreenEntered = () => {
        screenfull.off('change', onFullScreenEntered);
        resolve();
      };

      screenfull.on('change', onFullScreenEntered);

      const returnPromise = element[nativeAPI.requestFullscreen](options);
      if (returnPromise instanceof Promise) {
        returnPromise.then(onFullScreenEntered).catch(reject);
      }
    });
  },

  // Exit fullscreen mode
  exit() {
    return new Promise((resolve, reject) => {
      if (!screenfull.isFullscreen) {
        resolve();
        return;
      }

      const onFullScreenExit = () => {
        screenfull.off('change', onFullScreenExit);
        resolve();
      };

      screenfull.on('change', onFullScreenExit);

      const returnPromise = document[nativeAPI.exitFullscreen]();
      if (returnPromise instanceof Promise) {
        returnPromise.then(onFullScreenExit).catch(reject);
      }
    });
  },

  // Toggle fullscreen mode
  toggle(element, options) {
    return screenfull.isFullscreen ? screenfull.exit() : screenfull.request(element, options);
  },

  // Listen for fullscreen change events
  onchange(callback) {
    screenfull.on('change', callback);
  },

  // Listen for fullscreen error events
  onerror(callback) {
    screenfull.on('error', callback);
  },

  // Add event listener for specified event (change or error)
  on(event, callback) {
    const eventName = eventNameMap[event];
    if (eventName) {
      document.addEventListener(eventName, callback, false);
    }
  },

  // Remove event listener for specified event
  off(event, callback) {
    const eventName = eventNameMap[event];
    if (eventName) {
      document.removeEventListener(eventName, callback, false);
    }
  },

  // Raw access to native fullscreen API
  raw: nativeAPI,
};

// Define properties for screenfull (fullscreen status, current element, and API availability)
Object.defineProperties(screenfull, {
  isFullscreen: {
    get: () => Boolean(document[nativeAPI.fullscreenElement]),
  },
  element: {
    enumerable: true,
    get: () => document[nativeAPI.fullscreenElement] ?? undefined,
  },
  isEnabled: {
    enumerable: true,
    get: () => Boolean(document[nativeAPI.fullscreenEnabled]),
  },
});

// Fallback in case Fullscreen API is not supported
if (!nativeAPI) {
  screenfull = { isEnabled: false };
}

export default screenfull;
