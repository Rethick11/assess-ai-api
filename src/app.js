import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import testRoutes from "./modules/tests/tests.routes.js";
import submissionRoutes from "./modules/submission/submission.route.js";


const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);

app.use("/api/tests", testRoutes);



app.use("/api/submissions", submissionRoutes);

export default app;