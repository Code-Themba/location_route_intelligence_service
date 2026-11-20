import { NextFunction, Request, Response } from "express";
import { getOrFetchLocation, getOrFetchRoutes } from "./mapServices";

export async function getGeoCode(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await getOrFetchLocation(req.query.address as string);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Get User Route
export async function getRoute(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { origin, destination, mode } = req.query as Record<string, string>;
    const result = await getOrFetchRoutes(origin, destination, mode);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
