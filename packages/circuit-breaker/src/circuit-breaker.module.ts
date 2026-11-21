import { Global, Module } from '@nestjs/common';
import { CIRCUIT_BREAKER_SERVICE } from './circuit-breaker.interface.js';
import { CircuitBreakerService } from './circuit-breaker.service.js';

@Global()
@Module({
  providers: [
    {
      provide: CIRCUIT_BREAKER_SERVICE,
      useClass: CircuitBreakerService,
    },
    {
      provide: CircuitBreakerService,
      useExisting: CIRCUIT_BREAKER_SERVICE,
    },
  ],
  exports: [CIRCUIT_BREAKER_SERVICE, CircuitBreakerService],
})
export class CircuitBreakerModule {}
