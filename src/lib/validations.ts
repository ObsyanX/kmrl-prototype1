import { z } from 'zod';

// Employee ID validation - KMRL format
export const employeeIdSchema = z
  .string()
  .regex(/^KMRL[0-9]{6}$/, "Employee ID must be in format KMRL123456")
  .min(10, "Employee ID must be 10 characters")
  .max(10, "Employee ID must be 10 characters");

// Login form validation with support for multiple domains
export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      // Support both KMRL and Gmail for development
      return email.endsWith("@kmrl.org") || email.endsWith("@gmail.com");
    }, "Email must be a valid KMRL email address or Gmail address for development"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

// Developer login bypass
export const developerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  isDeveloper: z.boolean().optional(),
});

// Access request form validation
export const accessRequestSchema = z.object({
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  employee_id: employeeIdSchema,
  department: z
    .string()
    .min(1, "Please select a department"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      return email.endsWith("@kmrl.org") || email.endsWith("@gmail.com");
    }, "Email must be a valid KMRL email address or Gmail address for development"),
  justification: z
    .string()
    .min(50, "Justification must be at least 50 characters")
    .max(500, "Justification must be less than 500 characters"),
});

// Registration form validation
export const registrationSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      return email.endsWith("@kmrl.org") || email.endsWith("@gmail.com");
    }, "Email must be a valid KMRL email address or Gmail address for development"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  confirm_password: z.string(),
  employee_id: employeeIdSchema,
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .max(100, "Full name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
  department: z
    .string()
    .min(1, "Please select a department"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Override justification validation
export const overrideJustificationSchema = z.object({
  reason_category: z
    .string()
    .min(1, "Please select a reason category"),
  detailed_explanation: z
    .string()
    .min(30, "Explanation must be at least 30 characters")
    .max(500, "Explanation must be less than 500 characters"),
});

// Manual hold justification validation
export const manualHoldSchema = z.object({
  reason: z
    .string()
    .min(25, "Reason must be at least 25 characters")
    .max(500, "Reason must be less than 500 characters"),
});

// Support ticket validation
export const supportTicketSchema = z.object({
  subject: z
    .string()
    .min(10, "Subject must be at least 10 characters")
    .max(200, "Subject must be less than 200 characters"),
  affected_page: z
    .string()
    .min(1, "Please select the affected page/feature"),
  urgency: z
    .string()
    .refine((val) => ["low", "medium", "high", "critical"].includes(val), {
      message: "Please select a valid urgency level",
    }),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type AccessRequestFormData = z.infer<typeof accessRequestSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type OverrideJustificationData = z.infer<typeof overrideJustificationSchema>;
export type ManualHoldData = z.infer<typeof manualHoldSchema>;
export type SupportTicketData = z.infer<typeof supportTicketSchema>;