import "dotenv/config";
import app from "./src/app.js";

const PORT = process.env.PORT || 5001;

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
