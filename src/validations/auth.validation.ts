import z from "zod";

export const loginSchema = z.object({
  email: z.email().nonempty(),
  password: z.coerce.string().min(6),
});

export const signinSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().nonempty().min(6, "Username is required"),
  email: z.email().nonempty(),
  password: z.coerce.string().min(6),
  address: z.string().optional(),
  country: z.string().min(6).max(24),
  isPrivate: z.boolean(),
  bio: z.string().optional(),
});
