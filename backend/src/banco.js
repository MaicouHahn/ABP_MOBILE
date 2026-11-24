import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function abrirBanco(caminho) {
  mkdirSync(dirname(caminho), { recursive: true });
  const banco = new DatabaseSync(caminho);
  banco.exec(`
    CREATE TABLE IF NOT EXISTS registros (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('troca', 'banho', 'mamadeira', 'medicacao', 'ronda', 'ocorrencia')),
      acolhidoId TEXT,
      quantidade TEXT,
      observacao TEXT,
      quando TEXT NOT NULL,
      autora TEXT NOT NULL
    );
  `);
  return banco;
}
