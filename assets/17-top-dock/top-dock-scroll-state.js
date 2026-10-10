const TOP_THRESHOLD = 72;
const DIRECTION_THRESHOLD = 12;

export function createTopDockScrollTracker() {
  let previousY = null;
  let direction = 0;
  let distance = 0;
  let visible = true;

  return {
    update(nextY, busy = false) {
      const currentY = Math.max(0, nextY);
      if (previousY === null) {
        previousY = currentY;
        return visible;
      }
      const delta = currentY - previousY;
      previousY = currentY;

      if (currentY <= TOP_THRESHOLD || busy) {
        direction = 0;
        distance = 0;
        visible = true;
        return visible;
      }
      if (delta === 0) return visible;

      const nextDirection = Math.sign(delta);
      if (nextDirection !== direction) {
        direction = nextDirection;
        distance = 0;
      }
      distance += Math.abs(delta);

      if (distance >= DIRECTION_THRESHOLD) {
        visible = direction < 0;
        distance = 0;
      }
      return visible;
    },
  };
}
