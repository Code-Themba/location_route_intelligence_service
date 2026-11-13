import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();

const PORT = 5000;

app.listen(PORT, () => console.log(`map-api running on port ${PORT}`));
