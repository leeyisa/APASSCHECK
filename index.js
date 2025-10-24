import express from "express";
import fetch from "node-fetch";

// ===== Config via env =====
const PROGRAM_ID = process.env.PROGRAM_ID || "";
const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
const SHARED_TOKEN = process.env.SHARED_TOKEN || "cleanverse";
const MIN_CALLS = Number(process.env.MIN_CALLS || 1);
const START_AT = process.env.START_AT ? Date.parse(process.env.START_AT) / 1000 : 0;
const END_AT = process.env.END_AT ? Date.parse(process.env.END_AT) / 1000 : 4102444800; // ~2100-01-01
const MAX_PAGES = Number(process.env.MAX_PAGES || 4); // per address (4*50 = 200 sigs)

const app = express();

async function rpc(method, params) {
  const r = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return r.json();
}

async function collectSigsFor(addr) {
  const sigs = [];
  let before = undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const resp = await rpc("getSignaturesForAddress", [addr, { limit: 50, before }]);
    const arr = resp?.result || [];
    if (arr.length === 0) break;
    for (const it of arr) {
      const t = it.blockTime;
      if (t && t < START_AT) return sigs; // stop if we've gone past the start window
      if (t && t > END_AT) continue;      // skip if too new
      sigs.push(it.signature);
    }
    before = arr[arr.length - 1]?.signature;
  }
  return sigs;
}

app.get("/health", async (req, res) => {
  try {
    const h = await rpc("getHealth", []);
    res.json({ ok: true, rpc_url: RPC_URL, health: h });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/verify", async (req, res) => {
  try {
    const token = req.headers["x-auth-token"];
    if (token !== SHARED_TOKEN) {
      return res.status(401).send("0");
    }

    const address = req.query.address;
    if (!address || typeof address !== "string" || address.length < 32 || address.length > 60) {
      return res.status(400).send("0");
    }
    if (!PROGRAM_ID) return res.status(500).send("0");

    // Collect signatures (intersection approach, no getTransaction needed)
    const [walletSigs, programSigs] = await Promise.all([
      collectSigsFor(address),
      collectSigsFor(PROGRAM_ID),
    ]);

    const setProgram = new Set(programSigs);
    let found = 0;
    for (const s of walletSigs) if (setProgram.has(s)) found++;

    const ok = found >= MIN_CALLS ? "1" : "0";
    res.type("text/plain").send(ok);
  } catch (e) {
    // Fail closed
    res.status(200).type("text/plain").send("0");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server ready on :${PORT}`);
});
