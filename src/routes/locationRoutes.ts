import { Router } from "express";
import { getGeoCode, getRoute } from "../services/routeServices";
import {
  geocodeSchema,
  routeSchema,
  validateQuery,
} from "../middleware/validate";

const router = Router();

router.get("/geocode", validateQuery(geocodeSchema), getGeoCode);
router.get("/route", validateQuery(routeSchema), getRoute);

export default router;
