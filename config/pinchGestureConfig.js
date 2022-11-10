const PINCH_EVENTS = {
  START: 'pinch_start',
  MOVE: 'pinch_move',
  STOP: 'pinch_stop',
}

const PINCH_OPTIONS = {
  PINCH_DELAY_MS: 250,
  IS_CLOSE_ENOUGH: {
    x: 0.08,
    y: 0.08,
    z: 0.11,
  },
}

const PINCH_STATE = {
  isPinched: false,
  pinchChangeTimeout: null,
}

export default { PINCH_EVENTS, PINCH_OPTIONS, PINCH_STATE }
