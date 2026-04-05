import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that animates a number from 0 to a target value.
 * Uses requestAnimationFrame for smooth 60fps animation.
 *
 * @param {number|string} target - The target value to count up to
 * @param {number} duration - Animation duration in milliseconds (default: 1000)
 * @returns {string|number} The current animated value
 */
export default function useCountUp(target, duration = 1000) {
  const numericTarget = typeof target === 'number' ? target : parseFloat(target);

  // If not a valid number, just return the raw value (e.g. "N/A")
  if (isNaN(numericTarget)) {
    return target;
  }

  // If zero, skip animation
  if (numericTarget === 0) {
    return 0;
  }

  const [current, setCurrent] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);

      setCurrent(Math.round(eased * numericTarget));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [numericTarget, duration]);

  return current;
}
