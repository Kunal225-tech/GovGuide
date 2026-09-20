import app from "./app";
import connectDB from "./config/db";

const PORT = 5000;
const strtServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
}
strtServer();