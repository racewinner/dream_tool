import { useEffect, useRef } from 'react';

/**
 * A custom hook that runs a callback at specified intervals
 * @param callback The function to run
 * @param delay The delay in milliseconds. Null to pause the interval.
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * A custom hook that debounces a function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timer = useRef<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }

    timer.current = setTimeout(() => {
      fn(...args);
      timer.current = null;
    }, delay);
  };
}

/**
 * A custom hook that implements a polling mechanism with automatic backoff
 * @param callback The function to run
 * @param options Polling options
 */
export function usePolling(
  callback: () => Promise<boolean>, // Return true to continue polling, false to stop
  {
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 1.5,
    maxAttempts = 100,
    resetOnDependenciesChange = true
  }: {
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    maxAttempts?: number;
    resetOnDependenciesChange?: boolean;
    dependencies?: any[];
  }
) {
  const attemptsRef = useRef(0);
  const currentDelayRef = useRef(initialDelay);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const poll = useRef<() => void>();
  
  poll.current = async () => {
    if (!mountedRef.current) return;
    
    attemptsRef.current += 1;
    if (attemptsRef.current > maxAttempts) return;
    
    try {
      const shouldContinue = await callback();
      
      if (shouldContinue && mountedRef.current) {
        // Increase delay with backoff
        currentDelayRef.current = Math.min(
          currentDelayRef.current * backoffFactor,
          maxDelay
        );
        
        timeoutRef.current = setTimeout(() => {
          if (poll.current) poll.current();
        }, currentDelayRef.current);
      }
    } catch (error) {
      console.error('Error in polling:', error);
      
      if (mountedRef.current) {
        // Increase delay with backoff on error
        currentDelayRef.current = Math.min(
          currentDelayRef.current * backoffFactor,
          maxDelay
        );
        
        timeoutRef.current = setTimeout(() => {
          if (poll.current) poll.current();
        }, currentDelayRef.current);
      }
    }
  };
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Start polling
    if (poll.current) poll.current();
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Reset polling when dependencies change
  const resetPolling = () => {
    attemptsRef.current = 0;
    currentDelayRef.current = initialDelay;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (poll.current) poll.current();
  };
  
  return { resetPolling };
}
