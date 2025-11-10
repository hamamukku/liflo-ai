import dotenv from "dotenv";
import app from "./server.js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  console.log(`Liflo API running on http://localhost:${PORT}`);
});
