import { z } from 'zod';

const roleEnum = z.enum(['employee', 'manager', 'admin']);
const typeEnum = z.enum(['regular', 'contract', 'intern', 'part_time']);
const statusEnum = z.enum(['active', 'on_leave', 'resigned']);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다');

export const employeeCreateSchema = z.object({
  email: z.string().email(),
  nameKo: z.string().trim().min(1).max(50),
  nameEn: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  employeeNo: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  role: roleEnum.default('employee'),
  employmentType: typeEnum.default('regular'),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  jobTitle: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  position: z.string().trim().max(80).optional().nullable().or(z.literal('')),
  hireDate: isoDate,
  phone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;

export const employeeUpdateSchema = z
  .object({
    nameKo: z.string().trim().min(1).max(50).optional(),
    nameEn: z.string().trim().max(80).nullable().optional().or(z.literal('')),
    employeeNo: z.string().trim().max(40).nullable().optional().or(z.literal('')),
    role: roleEnum.optional(),
    employmentType: typeEnum.optional(),
    employmentStatus: statusEnum.optional(),
    departmentId: z.string().uuid().nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
    jobTitle: z.string().trim().max(80).nullable().optional().or(z.literal('')),
    position: z.string().trim().max(80).nullable().optional().or(z.literal('')),
    hireDate: isoDate.optional(),
    resignationDate: isoDate.nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional().or(z.literal('')),
  })
  .strict();

export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

export const employeeSelfUpdateSchema = z
  .object({
    phone: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    emergencyContactName: z.string().trim().max(60).nullable().optional(),
    emergencyContactPhone: z.string().trim().max(40).nullable().optional(),
    emergencyContactRelation: z.string().trim().max(30).nullable().optional(),
    smsOptIn: z.boolean().optional(),
  })
  .strict();

export type EmployeeSelfUpdateInput = z.infer<typeof employeeSelfUpdateSchema>;

export const organizationUpdateSchema = z.object({
  employeeId: z.string().uuid(),
  departmentId: z.string().uuid().nullable(),
  managerId: z.string().uuid().nullable(),
});

export const leavePolicyUpdateSchema = z.object({
  id: z.string().uuid(),
  basis: z.enum(['hire_date', 'fiscal_year']),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  fiscalYearStartDay: z.number().int().min(1).max(31),
  maxCarryoverDays: z.number().min(0).max(365),
  promotionFirstWarnMonths: z.number().int().min(0).max(24),
  promotionSecondWarnMonths: z.number().int().min(0).max(24),
});
