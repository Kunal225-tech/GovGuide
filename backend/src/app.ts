import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import profileRoutes from "./routes/authRoutes";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/" , (req,res) => {
    res.json({
        messgae: "GovGuide API is running"
    })
})

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
export default app;