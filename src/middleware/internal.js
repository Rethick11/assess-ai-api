export function internalOnly(req, res, next) {
  const secret = req.headers["x-internal-secret"];
  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: "Forbidden." });
  }
  next();
}