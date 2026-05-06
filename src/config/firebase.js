import fs from "fs";
import path from "path";
import admin from "firebase-admin";

// Load JSON manually
const serviceAccountPath = path.resolve("./src/config/serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminAuth = admin.auth();
export default admin;