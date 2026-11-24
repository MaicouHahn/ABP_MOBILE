import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { criarApi } from "../src/server.js";

async function iniciar(caminho) {
  const api = criarApi(caminho);
  await new Promise((ok) => api.listen(0, "127.0.0.1", ok));
  return { api, url: `http://127.0.0.1:${api.address().port}` };
}

async function parar(api) {
  await new Promise((ok, falhou) => api.close((erro) => erro ? falhou(erro) : ok()));
}

test("API valida registros, salva no SQLite e recupera após reiniciar", async () => {
  const pasta = mkdtempSync(join(tmpdir(), "acolher-api-"));
  const caminho = join(pasta, "teste.db");
  let atual = await iniciar(caminho);
  const enviar = (body) => fetch(atual.url + "/registros", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await fetch(atual.url + "/health")).status, 200);
    assert.deepEqual(await (await fetch(atual.url + "/registros")).json(), []);

    for (const body of [
      { tipo: "invalido", autora: "Yas" },
      { tipo: "troca", autora: "Yas" },
      { tipo: "banho", acolhidoId: "inexistente", autora: "Yas" },
      { tipo: "ronda", autora: "Yas" },
      { tipo: "troca", acolhidoId: "a1", autora: " " },
      { tipo: "ronda", autora: "Yas", observacao: 42 },
      null, [],
    ]) assert.equal((await enviar(body)).status, 400);

    const malformado = await fetch(atual.url + "/registros", { method: "POST", body: "{" });
    assert.equal(malformado.status, 400);
    const grande = await enviar({ tipo: "ronda", autora: "Yas", observacao: "x".repeat(17000) });
    assert.equal(grande.status, 400);

    // Apóstrofo e SQL como texto devem ser guardados, sem executar o conteúdo.
    const observacao = "Teste da Yas: d'água; DROP TABLE registros;";
    const resposta = await enviar({ tipo: "banho", acolhidoId: "a1", autora: " Yas ", observacao, quando: "data injetada" });
    assert.equal(resposta.status, 201);
    const salvo = await resposta.json();
    assert.equal(salvo.autora, "Yas");
    assert.equal(salvo.observacao, observacao);
    assert.ok(!Number.isNaN(new Date(salvo.quando).getTime()));
    const ronda = await enviar({ tipo: "ronda", autora: "Yas", observacao: "Todos dormindo." });
    assert.equal(ronda.status, 201);
    const mamadeira = await enviar({ tipo: "mamadeira", acolhidoId: "a2", quantidade: "180 ml", autora: "Yas" });
    assert.equal(mamadeira.status, 201);

    await parar(atual.api);
    atual = await iniciar(caminho);
    const lista = await (await fetch(atual.url + "/registros")).json();
    assert.equal(lista.length, 3);
    assert.deepEqual(lista.find((r) => r.id === salvo.id), salvo);
    assert.ok(lista.every((r, i) => i === 0 || lista[i - 1].quando >= r.quando));
    assert.equal((await fetch(atual.url + "/nao-existe")).status, 404);
    assert.equal((await fetch(atual.url + "/registros", { method: "OPTIONS" })).status, 204);
  } finally {
    await parar(atual.api);
    rmSync(pasta, { recursive: true, force: true });
  }
});
