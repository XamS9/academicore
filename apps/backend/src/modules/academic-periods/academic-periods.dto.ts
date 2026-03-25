import { z } from 'zod';

export const CreateAcademicPeriodDto = z.object({
  name: z.string().min(1).max(50),
  startDate: z.string(),
  endDate: z.string(),
  enrollmentOpen: z.boolean().default(false),
});
export type CreateAcademicPeriodDto = z.infer<typeof CreateAcademicPeriodDto>;

export const UpdateAcademicPeriodDto = CreateAcademicPeriodDto.partial();
export type UpdateAcademicPeriodDto = z.infer<typeof UpdateAcademicPeriodDto>;
