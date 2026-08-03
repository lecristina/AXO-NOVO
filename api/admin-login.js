/**
 * Login do painel admin (server-side).
 *
 * A senha nunca fica no cliente: o usuário digita, manda pra cá, a gente confere
 * contra a env ADMIN_PASSWORD e devolve um cookie de sessão HttpOnly assinado
 * (HMAC + expiração). O cookie é o que o /api/db verifica nas escritas. Assim, no
 * DevTools não aparece a senha, só um token rotativo que expira.
 */

const crypto = require("crypto");

function sign(secret, ttlMs) {
  const exp = String(Date.now() + ttlMs);
  const sig = crypto.createHmac("sha256", secret).update(exp).digest("hex");
  return Buffer.from(exp).toString("base64url") + "." + sig;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Método não permitido" });
    return;
  }

  const PWD = process.env.ADMIN_PASSWORD;
  const SECRET = process.env.ADMIN_SESSION_SECRET;
  if (!PWD || !SECRET) {
    res.status(500).json({ message: "Servidor sem configuração de auth" });
    return;
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (e) { payload = null; }
  }
  payload = payload || {};

  if (payload.logout) {
    res.setHeader("Set-Cookie", "axo_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    res.status(200).json({ ok: true });
    return;
  }

  const submitted = Buffer.from(String(payload.password || ""));
  const expected = Buffer.from(String(PWD));
  const ok = submitted.length === expected.length && crypto.timingSafeEqual(submitted, expected);
  if (!ok) {
    res.status(401).json({ ok: false, message: "Senha incorreta" });
    return;
  }

  const token = sign(SECRET, 8 * 60 * 60 * 1000);
  res.setHeader("Set-Cookie", "axo_admin_session=" + token + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
  res.status(200).json({ ok: true });
};
