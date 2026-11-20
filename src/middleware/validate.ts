import { Request, Response, NextFunction } from "express";
import { z, ZodType } from "zod";

export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: z.flattenError(result.error).fieldErrors,
      });
    }
    Object.assign(req.query, result.data);
    next();
  };
};

export const geocodeSchema = z.object({
  address: z.string().min(3, "Address must be at least 3 characters long"),
});
export const routeSchema = z.object({
  origin: z.string().min(3),
  destination: z.string().min(3),
  mode: z.enum(["DRIVING", "WALKING", "BICYCLING"]).default("DRIVING"),
});
