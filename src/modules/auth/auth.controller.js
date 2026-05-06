import { registerUser, loginUser, getUserByUid } from "./auth.service.js";

export async function register(req, res) {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!["teacher", "student"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be teacher or student." });
    }

    const user = await registerUser({ email, password, name, role });
    return res
      .status(201)
      .json({ message: "User registered successfully.", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const user = await loginUser(req.user.uid);
    return res.json({ message: "Login successful.", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await getUserByUid(req.user.uid);
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
