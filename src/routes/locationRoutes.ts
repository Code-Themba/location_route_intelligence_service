import { Router } from "express";
import { getGeoCode } from "../services/routeServices";

const router = Router();

router.get("/geocode", getGeoCode);
