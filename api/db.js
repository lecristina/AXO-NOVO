/**
 * Proxy de escrita do painel admin.
 *
 * A anon key do Supabase é somente-leitura (endurecida na auditoria de segurança).
 * Escritas precisam da service_role key, que NUNCA pode ir pro cliente (dá acesso
 * total ao banco). Esta função roda no servidor (Vercel), guarda a service key em
 * env, e só escreve se o cookie de sessão (setado por /api/admin-login) for válido.
 * Nada de senha no cliente: a auth é por cookie HttpOnly assinado (HMAC + exp).
 */

const crypto = require("crypto");

const SUPABASE_URL = "https://ecgjhahdceocsikbhsot.supabase.co";
const ALLOWED_TABLES = ["posts", "projects", "team", "testimonials", "settings", "companies"];
const ALLOWED_METHODS = ["POST", "PATCH", "DELETE"];

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const parts = raw.split(";");
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    if (p.indexOf(name + "=") === 0) return p.slice(name.length + 1);
  }
  return "";
}

function validSession(token, secret) {
  if (!token || token.indexOf(".") === -1) return false;
  const idx = token.indexOf(".");
  const b64 = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  let exp;
  try { exp = Buffer.from(b64, "base64url").toString(); } catch (e) { return false; }
  const expected = crypto.createHmac("sha256", secret).update(exp).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const expNum = parseInt(exp, 10);
  return Number.isFinite(expNum) && Date.now() < expNum;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Método não permitido" });
    return;
  }

  const SVC = process.env.SUPABASE_SERVICE_KEY;
  const SECRET = process.env.ADMIN_SESSION_SECRET;
  if (!SVC || !SECRET) {
    res.status(500).json({ message: "Servidor sem configuração de escrita" });
    return;
  }

  if (!validSession(readCookie(req, "axo_admin_session"), SECRET)) {
    res.status(401).json({ message: "Sessão inválida ou expirada" });
    return;
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (e) { payload = null; }
  }
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ message: "Corpo inválido" });
    return;
  }

  const method = String(payload.method || "").toUpperCase();
  if (ALLOWED_METHODS.indexOf(method) === -1) {
    res.status(400).json({ message: "Operação inválida" });
    return;
  }

  const path = String(payload.path || "");
  const table = path.split("?")[0].split("/")[0];
  if (ALLOWED_TABLES.indexOf(table) === -1) {
    res.status(403).json({ message: "Tabela não permitida" });
    return;
  }

  const headers = {
    apikey: SVC,
    Authorization: "Bearer " + SVC,
    "Content-Type": "application/json",
  };
  if (payload.prefer) headers.Prefer = payload.prefer;

  const hasBody = payload.body !== undefined && payload.body !== null && method !== "DELETE";

  try {
    const r = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
      method: method,
      headers: headers,
      body: hasBody ? JSON.stringify(payload.body) : undefined,
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (e) {
    res.status(502).json({ message: "Erro ao acessar o banco" });
  }
};
