export const convertCoordsToDomPosition = ({ x, y }) => ({
  x: `${x * 100}vw`,
  y: `${y * 100}vh`,
})

export const triggerEvent = ({ eventName, eventData }) => {
  const event = new CustomEvent(eventName, { detail: eventData });
  document.dispatchEvent(event);
}

