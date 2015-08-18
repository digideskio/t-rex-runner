module.exports = {
  /**
   * Default game width.
   */
  DEFAULT_WIDTH: 600,
  DEFAULT_HEIGHT: 150,
  /**
   * Frames per second.
   */
  FPS: 60,
  IS_HIDPI: window.devicePixelRatio > 1,
  IS_MOBILE: window.navigator.userAgent.indexOf('Mobi') > -1,
  IS_TOUCH_ENABLED: 'ontouchstart' in window,
  BOTTOM_PAD: 10,
  SOCKET_URL: 'ws://10.73.35.77:3030'
}