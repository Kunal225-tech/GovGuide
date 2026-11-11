import app from "./app";
import connectDB from "./config/db";
import { ENV } from "./config/env";

const startServer = async () => {
    try {
        await connectDB();
        app.listen(ENV.PORT, () => {
            console.log(`Server is running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();