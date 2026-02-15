import { z } from 'zod';

export const BaseResponseSchema = z.object({
  code: z.number().default(0),
  msg: z.string(),
  data: z.any().optional(),
});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
