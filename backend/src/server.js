import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { abrirBanco } from "./banco.js";

const tipos = ["troca", "banho", "mamadeira", "medicacao", "ronda", "ocorrencia"];
// IDs dos acolhidos fictícios que já existem em src/data/exemplos.ts.
// O cadastro de acolhidos no banco será uma próxima etapa.
const acolhidos = ["a1", "a2", "a3", "a4", "a5", "a6", "a7"];

function responder(res, status, dados) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dados));
}

async function lerCorpo(req) {
  const partes = [];
  let tamanho = 0;
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho > 16_384) throw new Error("Corpo muito grande.");
    partes.push(parte);
  }
  const dados = JSON.parse(Buffer.concat(partes).toString("utf8"));
  if (!dados || Array.isArray(dados) || typeof dados !== "object") {
    throw new Error("Envie um objeto JSON.");
  }
  return dados;
}

function validar(dados) {
  if (!tipos.includes(dados.tipo)) return "Tipo de registro inválido.";
  if (typeof dados.autora !== "string" || !dados.autora.trim() || dados.autora.length > 100) {
    return "Informe a educadora (até 100 caracteres).";
  }
  if (dados.acolhidoId != null && !acolhidos.includes(dados.acolhidoId)) {
    return "Acolhido inválido.";
  }
  if (!["ronda", "ocorrencia"].includes(dados.tipo) && !dados.acolhidoId) {
    return "Escolha para quem é o registro.";
  }
  for (const campo of ["observacao", "quantidade"]) {
    if (dados[campo] != null && (typeof dados[campo] !== "string" || dados[campo].length > 2000)) {
      return `${campo}: informe um texto de até 2000 caracteres.`;
    }
  }
  if (!dados.acolhidoId && !dados.observacao?.trim()) return "Descreva a ronda ou ocorrência.";
  return null;
}

export function criarApi(caminhoBanco) {
  const banco = abrirBanco(caminhoBanco);
  const servidor = createServer(async (req, res) => {
    // Permite a demonstração também pelo Expo Web.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    const rota = new URL(req.url, "http://localhost").pathname;
    try {
      if (req.method === "GET" && rota === "/health") {
        banco.prepare("SELECT 1").get();
        return responder(res, 200, { status: "ok", banco: "SQLite" });
      }
      if (req.method === "GET" && rota === "/registros") {
        const lista = banco.prepare("SELECT * FROM registros ORDER BY quando DESC, id DESC").all();
        return responder(res, 200, lista);
      }
      if (req.method === "POST" && rota === "/registros") {
        let dados;
        try {
          dados = await lerCorpo(req);
        } catch {
          return responder(res, 400, { erro: "Envie um JSON válido de até 16 KB." });
        }
        const erro = validar(dados);
        if (erro) return responder(res, 400, { erro });
        const registro = {
          id: randomUUID(),
          tipo: dados.tipo,
          acolhidoId: dados.acolhidoId ?? null,
          quantidade: dados.quantidade?.trim() || null,
          observacao: dados.observacao?.trim() || null,
          quando: new Date().toISOString(),
          autora: dados.autora.trim(),
        };
        // Os valores vão separados do SQL para não virarem comandos.
        banco.prepare(`
          INSERT INTO registros (id, tipo, acolhidoId, quantidade, observacao, quando, autora)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(registro.id, registro.tipo, registro.acolhidoId, registro.quantidade,
          registro.observacao, registro.quando, registro.autora);
        return responder(res, 201, registro);
      }
      return responder(res, 404, { erro: "Rota não encontrada." });
    } catch (erro) {
      console.error(erro);
      return responder(res, 500, { erro: "Não foi possível acessar o banco de dados." });
    }
  });
  servidor.on("close", () => banco.close());
  return servidor;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const caminho = process.env.DB_PATH || fileURLToPath(new URL("../dados/acolher.db", import.meta.url));
  const porta = Number(process.env.PORT || 3000);
  const servidor = criarApi(caminho);
  servidor.listen(porta, "0.0.0.0", () => console.log(`API Acolher na porta ${porta}`));
  servidor.on("error", (erro) => {
    console.error("Não foi possível iniciar a API:", erro.message);
    process.exitCode = 1;
  });
  for (const sinal of ["SIGINT", "SIGTERM"]) {
    process.on(sinal, () => servidor.close());
  }
}
