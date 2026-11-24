import { Platform } from "react-native";
import type { Registro } from "../data/tipos";

// No emulador Android, 10.0.2.2 aponta para o computador.
// No celular físico, configure EXPO_PUBLIC_API_URL com o IP do computador.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000")).replace(/\/$/, "");

type RegistroJson = Omit<Registro, "quando" | "acolhidoId" | "quantidade" | "observacao"> & {
  quando: string;
  acolhidoId: string | null;
  quantidade: string | null;
  observacao: string | null;
};

export function converterRegistro(r: RegistroJson): Registro {
  return {
    ...r,
    quando: new Date(r.quando),
    acolhidoId: r.acolhidoId ?? undefined,
    quantidade: r.quantidade ?? undefined,
    observacao: r.observacao ?? undefined,
  };
}

async function requisitar(caminho: string, body?: unknown) {
  const controle = new AbortController();
  const tempo = setTimeout(() => controle.abort(), 10000);
  try {
    const resposta = await fetch(API_URL + caminho, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controle.signal,
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Erro ao acessar os registros.");
    return dados;
  } finally {
    clearTimeout(tempo);
  }
}

export async function listarRegistros(): Promise<Registro[]> {
  const lista: RegistroJson[] = await requisitar("/registros");
  return lista.map(converterRegistro);
}

export async function salvarRegistro(dados: Omit<Registro, "id" | "quando">): Promise<Registro> {
  return converterRegistro(await requisitar("/registros", dados));
}
