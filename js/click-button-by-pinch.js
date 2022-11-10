import { Camera } from "@mediapipe/camera_utils"
import { Hands } from "@mediapipe/hands"
import handParts from '../config/handParts'
import { convertCoordsToDomPosition, triggerEvent } from '../utils'
import '../style.css'
import pinchConfig from '../config/pinchGestureConfig'

const { PINCH_EVENTS, PINCH_OPTIONS, PINCH_STATE } = pinchConfig
const { IS_CLOSE_ENOUGH } = PINCH_OPTIONS

const video$ = document.querySelector('video')
const cursor$ = document.querySelector('.cursor2')
const counter$ = document.querySelector('p')
const button$ = document.querySelector('button')

const width = window.innerWidth;
const height = window.innerHeight;

const buttonRect = button$.getBoundingClientRect()

const hands = new Hands({
  locateFile: (file) => `../node_modules/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
});
hands.onResults(onResults);

const camera = new Camera(video$, {
  onFrame: async () => {
    await hands.send({ image: video$ });
  },
  width,
  height,
});
camera.start();

let count = 0

button$.addEventListener('click', () => {
  counter$.textContent = ++count
})

const getFingerCoords = (landmarks) => landmarks[handParts.indexFinger.tip]

function updateCursorPosition(landmarks) {
  const fingerCoords = getFingerCoords(landmarks)

  if (!fingerCoords) return

  const { x, y } = convertCoordsToDomPosition(fingerCoords)

  cursor$.style.transform = `translate(${x}, ${y})`

  const hit = isIntersected()

  if (hit) {
    button$.style.border = '2px solid #5cb85c'
  } else {
    button$.style.border = '2px solid #0275d8'
  }
}

function onResults(handData) {
  if (!handData.multiHandLandmarks.length) return;

  updateCursorPosition(handData.multiHandLandmarks[0]);

  updatePinchState(handData.multiHandLandmarks[0]);
}

function isIntersected() {
  const cursorRect = cursor$.getBoundingClientRect()

  const hit =
    cursorRect.x >= buttonRect.x &&
    cursorRect.y >= buttonRect.y &&
    cursorRect.x + cursorRect.width <= buttonRect.x + buttonRect.width &&
    cursorRect.y + cursorRect.height <= buttonRect.y + buttonRect.height

  return hit
}

function isPinched(landmarks) {
  const fingerTip = landmarks[handParts.indexFinger.tip];
  const thumbTip = landmarks[handParts.thumb.tip];
  if (!fingerTip || !thumbTip) return;

  const distance = {
    x: Math.abs(fingerTip.x - thumbTip.x),
    y: Math.abs(fingerTip.y - thumbTip.y),
    z: Math.abs(fingerTip.z - thumbTip.z),
  };

  const areFingersCloseEnough =
    distance.x < IS_CLOSE_ENOUGH.x && distance.y < IS_CLOSE_ENOUGH.y && distance.z < IS_CLOSE_ENOUGH.z;

  return areFingersCloseEnough;
}

function updatePinchState(landmarks) {
  const wasPinchedBefore = PINCH_STATE.isPinched;
  const isPinchedNow = isPinched(landmarks);
  const hasPassedPinchThreshold = isPinchedNow !== wasPinchedBefore;
  const hasWaitStarted = !!PINCH_STATE.pinchChangeTimeout;

  if (hasPassedPinchThreshold && !hasWaitStarted) {
    registerChangeAfterWait(landmarks, isPinchedNow);
  }

  if (!hasPassedPinchThreshold) {
    cancelWaitForChange();
  }
}

function registerChangeAfterWait(landmarks, isPinchedNow) {
  PINCH_STATE.pinchChangeTimeout = setTimeout(() => {
    PINCH_STATE.isPinched = isPinchedNow;

    triggerEvent({
      eventName: isPinchedNow ? PINCH_EVENTS.START : PINCH_EVENTS.STOP,
      eventData: getFingerCoords(landmarks),
    });
  }, PINCH_OPTIONS.PINCH_DELAY_MS);
}

function cancelWaitForChange() {
  clearTimeout(PINCH_STATE.pinchChangeTimeout);
  PINCH_STATE.pinchChangeTimeout = null;
}

function onPinchStart() {
  const hit = isIntersected();

  if (hit) {
    button$.click();
  }
}

document.addEventListener(PINCH_EVENTS.START, onPinchStart);
