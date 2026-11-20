import { NextFunction, Request, Response } from "express";
import { getOrFetchLocation } from "./mapServices";

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
    const result = await getOrFetchRoute(origin, destination, mode);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
function getOrFetchRoute(origin: string, destination: string, mode: string) {
  throw new Error("Function not implemented.");
}
