import * as z from "zod";

export const emailSchema = z
  .email("Invalid email format")
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .transform((val) => val.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((val) => /[a-z]/.test(val), {
    message: "Password must include at least one lowercase letter",
  })
  .refine((val) => /[A-Z]/.test(val), {
    message: "Password must include at least one uppercase letter",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Password must include at least one number",
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: "Password must include at least one special character",
  })
  .refine((val) => !/\s/.test(val), {
    message: "Password must not contain spaces",
  });

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters")
  .refine((val) => /^[A-Za-z][A-Za-z\s\-'.]*$/.test(val), {
    message: "Name contains invalid characters",
  });

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerPayloadSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const credentialsSchema = loginSchema;

export const oauthProviderEnvSchema = z.object({
  clientId: z.string().min(1, "Missing OAuth client ID"),
  clientSecret: z.string().min(1, "Missing OAuth client secret"),
});

export const nextAuthSecretSchema = z
  .string()
  .min(32, "NEXTAUTH_SECRET must be at least 32 characters");

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPayload = z.infer<typeof registerPayloadSchema>;
export type OAuthProviderEnv = z.infer<typeof oauthProviderEnvSchema>;
