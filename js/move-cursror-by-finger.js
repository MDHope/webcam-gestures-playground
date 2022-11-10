import { Camera } from "@mediapipe/camera_utils"
import { Hands } from "@mediapipe/hands"
import handParts from '../config/handParts'
import { convertCoordsToDomPosition } from '../utils'
import "../style.css"

const video$ = document.querySelector("video")
const cursor$ = document.querySelector(".cursor")

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
    await hands.send({ image: video$ });
  },
  facingMode: undefined,
  width,
  height,
})
camera.start()

const getCursorCoords = (landmarks) =>
  landmarks[handParts.indexFinger.topKnuckle]

function updateCursorPosition(landmarks) {
  const cursorCoords = getCursorCoords(landmarks)
  if (!cursorCoords) return

  const { x, y } = convertCoordsToDomPosition(cursorCoords)

  cursor$.style.transform = `translate(${x}, ${y})`
}

function onResults(handData) {
  if (!handData.multiHandLandmarks.length) return

  updateCursorPosition(handData.multiHandLandmarks[0])
}
