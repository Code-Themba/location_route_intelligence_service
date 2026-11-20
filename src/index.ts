import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import { apiRateLimiter } from "./middleware/rateLimiter";
import locationRoutes from "./routes/locationRoutes";

const app = express();

app.use(express.json());
app.use("/api/v1", apiRateLimiter);
app.use("/api/v1/locations", locationRoutes);

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  res.status(502).json({
    error: err.cause?.message || err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`map-api running on port ${PORT}`));
