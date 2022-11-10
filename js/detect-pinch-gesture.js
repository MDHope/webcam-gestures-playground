import { Camera } from "@mediapipe/camera_utils"
import { Hands } from "@mediapipe/hands"
import handParts from '../config/handParts'
import pinchConfig from '../config/pinchGestureConfig'

const { PINCH_EVENTS, PINCH_OPTIONS, PINCH_STATE } = pinchConfig
const { IS_CLOSE_ENOUGH } = PINCH_OPTIONS

const video$ = document.querySelector('video')

const width = window.innerWidth
const height = window.innerHeight

const hands = new Hands({
  locateFile: (file) => `../node_modules/@mediapipe/hands/${file}`,
})
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
})
hands.onResults(onResults)

const camera = new Camera(video$, {
  onFrame: async () => {
    await hands.send({ image: video$ })
  },
  width,
  height,
})
camera.start()

const getFingerCoords = (landmarks) => landmarks[handParts.indexFinger.topKnuckle]

function onResults(handData) {
  if (!handData.multiHandLandmarks.length) return

  updatePinchState(handData.multiHandLandmarks[0])
}

function isPinched(landmarks) {
  const fingerTip = landmarks[handParts.indexFinger.tip]
  const thumbTip = landmarks[handParts.thumb.tip]

  if (!fingerTip || !thumbTip) return

  const distance = {
    x: Math.abs(fingerTip.x - thumbTip.x),
    y: Math.abs(fingerTip.y - thumbTip.y),
    z: Math.abs(fingerTip.z - thumbTip.z),
  }

  const areFingersCloseEnough = distance.x < IS_CLOSE_ENOUGH.x && distance.y < IS_CLOSE_ENOUGH.y && distance.z < IS_CLOSE_ENOUGH.z

  return areFingersCloseEnough
}

function triggerEvent({ eventName, eventData}) {
  const event = new CustomEvent(eventName, { detail: eventData })
  document.dispatchEvent(event)
}

function updatePinchState(landmarks) {
  const wasPinchedBefore = PINCH_STATE.isPinched
  const isPinchedNow = isPinched(landmarks)
  const hasPassedPinchThreshold = isPinchedNow !== wasPinchedBefore
  const hasWaitStarted = !!PINCH_STATE.pinchChangeTimeout

  if (hasPassedPinchThreshold && !hasWaitStarted) {
    registerChangeAfterWait(landmarks, isPinchedNow)
  }

  if (!hasPassedPinchThreshold) {
    cancelWaitForChange()
  }

  if (isPinchedNow) {
    triggerEvent({
      eventName: PINCH_EVENTS.MOVE,
      eventData: getFingerCoords(landmarks),
    })
  }
}

function registerChangeAfterWait(landmarks, isPinchedNow) {
  PINCH_STATE.pinchChangeTimeout = setTimeout(() => {
    PINCH_STATE.isPinched = isPinchedNow

    triggerEvent({
      eventName: isPinchedNow ? PINCH_EVENTS.START : PINCH_EVENTS.STOP,
      eventData: getFingerCoords(landmarks),
    })
  }, PINCH_OPTIONS.PINCH_DELAY_MS)
}

function cancelWaitForChange() {
  clearTimeout(PINCH_STATE.pinchChangeTimeout)
  PINCH_STATE.pinchChangeTimeout = null
}

function onPinchStart(eventInfo) {
  const fingerCoords = eventInfo.detail
  console.log('pinch started: ', fingerCoords)
}

function onPinchMove(eventInfo) {
  const fingerCoords = eventInfo.detail
  console.log('pinch moved: ', fingerCoords)
}

function onPinchStop(eventInfo) {
  const fingerCoords = eventInfo.detail
  console.log('pinch stoped: ', fingerCoords)
}

document.addEventListener(PINCH_EVENTS.START, onPinchStart)
document.addEventListener(PINCH_EVENTS.MOVE, onPinchMove)
document.addEventListener(PINCH_EVENTS.STOP, onPinchStop)
