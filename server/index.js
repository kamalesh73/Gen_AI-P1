import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = process.env.PORT || 5000;

connectDatabase()
  .catch((error) => {
    console.warn("MongoDB disabled:", error.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`API running on http://127.0.0.1:${port}`);
    });
  });
