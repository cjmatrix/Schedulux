import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { Observable, lastValueFrom } from 'rxjs';
import {
  CircuitBreakerConfig,
  ICircuitBreakerService,
} from './circuit-breaker.interface.js';

@Injectable()
export class CircuitBreakerService
  implements ICircuitBreakerService, OnModuleDestroy
{
  private readonly _logger = new Logger(CircuitBreakerService.name);
  private readonly _breakers = new Map<
    string,
    CircuitBreaker<[() => Promise<any>], any>
  >();

 
  private _isClientError(err: any): boolean {
    if (!err) return false;

   
    const httpStatus =
      err.status ??
      err.statusCode ??
      (typeof err.getStatus === 'function' ? err.getStatus() : undefined);
    if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
      return true;
    }

  
    const grpcCode = err.code;
    if (typeof grpcCode === 'number' && [3, 5, 6, 7, 8, 9, 16].includes(grpcCode)) {
      return true;
    }

    return false;
  }

  private _getBreaker(
    name: string,
    customOptions?: CircuitBreakerConfig,
  ): CircuitBreaker<[() => Promise<any>], any> {
    const existing = this._breakers.get(name);
    if (existing) {
      return existing;
    }

    const isLlmStream = name.includes('stream');
    const isLlmUnary =
      name.includes('chat') || name.includes('onboarding') || name.includes('crawl');

  
    const defaultTimeout = isLlmStream ? 45000 : isLlmUnary ? 25000 : 5000;
    const defaultVolumeThreshold = isLlmStream || isLlmUnary ? 3 : 5;

    const options: CircuitBreaker.Options = {
      timeout: customOptions?.timeout ?? defaultTimeout,
      errorThresholdPercentage: customOptions?.errorThresholdPercentage ?? 50,
      resetTimeout: customOptions?.resetTimeout ?? 10000,
      rollingCountTimeout: customOptions?.rollingCountTimeout ?? 10000,
      volumeThreshold: customOptions?.volumeThreshold ?? defaultVolumeThreshold,
      errorFilter: (err: any) =>
        customOptions?.errorFilter
          ? customOptions.errorFilter(err) || this._isClientError(err)
          : this._isClientError(err),
    };

    const breaker = new CircuitBreaker(
      async (action: () => Promise<any>) => await action(),
      options,
    );

    breaker.on('open', () => {
      this._logger.warn(
        `[CircuitBreaker] Breaker "${name}" TRIPPED OPEN. Downstream calls will fail fast.`,
      );
    });

    breaker.on('halfOpen', () => {
      this._logger.log(
        `[CircuitBreaker] Breaker "${name}" is HALF-OPEN. Probing downstream service...`,
      );
    });

    breaker.on('close', () => {
      this._logger.log(
        `[CircuitBreaker] Breaker "${name}" CLOSED. Downstream service recovered successfully.`,
      );
    });

    breaker.on('timeout', () => {
      this._logger.warn(
        `[CircuitBreaker] Breaker "${name}" call timed out after ${options.timeout}ms.`,
      );
    });

    breaker.on('reject', () => {
      this._logger.warn(
        `[CircuitBreaker] Breaker "${name}" rejected call (circuit is OPEN).`,
      );
    });

    this._breakers.set(name, breaker);
    return breaker;
  }


  async execute<T>(
    breakerName: string,
    action: () => Promise<T>,
    fallback?: (error: any) => Promise<T> | T,
    options?: CircuitBreakerConfig,
  ): Promise<T> {
    const breaker = this._getBreaker(breakerName, options);
    try {
      return (await breaker.fire(action)) as T;
    } catch (err: any) {
      if (fallback) {
        return await fallback(err);
      }

      if (
        breaker.opened ||
        err?.code === 'EOPENBREAKER' ||
        err?.message?.includes('Breaker is open')
      ) {
        throw new ServiceUnavailableException(
          `Service "${breakerName}" is temporarily unavailable. Downstream circuit is open.`,
        );
      }

      throw err;
    }
  }

  
  isOpen(breakerName: string): boolean {
    const breaker = this._breakers.get(breakerName);
    return breaker ? breaker.opened : false;
  }

  
  recordFailure(breakerName: string, error?: any): void {
    const breaker = this._getBreaker(breakerName);
    breaker
      .fire(() => Promise.reject(error || new Error(`External failure recorded on ${breakerName}`)))
      .catch(() => {});
  }

  
  recordSuccess(breakerName: string): void {
    const breaker = this._getBreaker(breakerName);
    breaker.fire(() => Promise.resolve()).catch(() => {});
  }

 
  wrapGrpcClient<T extends object>(
    name: string,
    client: T,
    options?: CircuitBreakerConfig,
  ): T {
    const self = this;
    return new Proxy(client, {
      get(target: any, prop: string | symbol) {
        const original = target[prop];
        if (typeof original !== 'function') {
          return original;
        }
        return function (...args: any[]) {
          const obs = original.apply(target, args);
          if (obs && typeof obs.subscribe === 'function') {
            return new Observable((subscriber) => {
              self
                .execute(name, () => lastValueFrom(obs), undefined, options)
                .then((result) => {
                  subscriber.next(result);
                  subscriber.complete();
                })
                .catch((err) => {
                  subscriber.error(err);
                });
            });
          }
          return obs;
        };
      },
    });
  }

 
  onModuleDestroy() {
    for (const [name, breaker] of this._breakers) {
      try {
        breaker.shutdown();
      } catch (err) {
        this._logger.error(`Error shutting down breaker "${name}":`, err);
      }
    }
    this._breakers.clear();
  }
}
