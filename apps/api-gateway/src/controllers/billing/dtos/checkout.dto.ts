import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCheckoutSchema = z.object({
  plan: z.enum(['pro', 'business', 'enterprise'], {
    message: 'Plan must be one of: pro, business, enterprise',
  }),
});

export class CreateCheckoutDto extends createZodDto(CreateCheckoutSchema) {}
