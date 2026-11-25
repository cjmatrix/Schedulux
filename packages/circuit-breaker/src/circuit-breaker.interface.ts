/**
 * Pure contract for circuit breaker configuration.
 * Framework- and library-agnostic (no Opossum or external library types).
 */
export interface CircuitBreakerConfig {
  /**
   * Execution timeout in milliseconds before a request is treated as timed out.
   */
  timeout?: number;

  /**
   * Percentage of failed requests within rollingCountTimeout needed to open the circuit (0 to 100).
   */
  errorThresholdPercentage?: number;

  /**
   * Time in milliseconds to wait in OPEN state before switching to HALF-OPEN to probe the service.
   */
  resetTimeout?: number;

  /**
   * Window size in milliseconds for tracking failures and success metrics.
   */
  rollingCountTimeout?: number;

  /**
   * Minimum number of requests inside rollingCountTimeout required before calculating error percentage.
   */
  volumeThreshold?: number;

  /**
   * Predicate function. If it returns true, the error is treated as a client/business error
   * and will NOT increment the failure statistics or trip the circuit breaker.
   */
  errorFilter?: (error: any) => boolean;
}

/**
 * Dependency Inversion Principle (DIP) abstraction for Circuit Breaking & Outbound Resilience.
 * High-level consumers depend exclusively on this interface, never on low-level libraries.
 */
export interface ICircuitBreakerService {
  /**
   * Execute an async action within a named circuit breaker.
   * If the circuit is open or execution fails/times out, fallback will be invoked if provided;
   * otherwise a ServiceUnavailableException (HTTP 503) is thrown.
   */
  execute<T>(
    breakerName: string,
    action: () => Promise<T>,
    fallback?: (error: any) => Promise<T> | T,
    options?: CircuitBreakerConfig,
  ): Promise<T>;

  /**
   * Check whether a specific circuit breaker is currently open.
   */
  isOpen(breakerName: string): boolean;

  /**
   * Record an external failure (such as an error event emitted by an SSE or gRPC stream).
   */
  recordFailure(breakerName: string, error?: any): void;

  /**
   * Record an external success (such as a successful completion of a stream).
   */
  recordSuccess(breakerName: string): void;

  /**
   * Transparently wraps all unary gRPC service methods with a CircuitBreaker proxy.
   * Any call returning an Observable will execute its promise via the circuit breaker.
   */
  wrapGrpcClient<T extends object>(
    name: string,
    client: T,
    options?: CircuitBreakerConfig,
  ): T;
}

/**
 * Dependency Injection token for ICircuitBreakerService.
 */
export const CIRCUIT_BREAKER_SERVICE = 'ICircuitBreakerService';
