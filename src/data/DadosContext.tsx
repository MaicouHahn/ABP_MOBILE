import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  acolhidosIniciais,
  doacoesIniciais,
  estoqueInicial,
} from "./exemplos";
import type {
  Acolhido,
  Doacao,
  ItemEstoque,
  Registro,
} from "./tipos";
import {
  listarRegistros,
  salvarRegistro,
} from "../services/registrosApi";

// Os registros são carregados e salvos pela API com SQLite.
// Acolhidos, estoque e doações ainda usam os exemplos em memória.

interface Dados {
  educadora: string | null;
  entrar: (usuario: string) => void;
  sair: () => void;

  acolhidos: Acolhido[];
  buscarAcolhido: (id?: string) => Acolhido | undefined;

  registros: Registro[];
  adicionarRegistro: (
    r: Omit<Registro, "id" | "quando" | "autora">
  ) => Promise<void>;

  estoque: ItemEstoque[];
  registrarEntrada: (e: {
    nome: string;
    quantidade: number;
    validade: Date | null;
  }) => void;

  doacoes: Doacao[];
  emitirRecibo: (d: Omit<Doacao, "id" | "numero">) => Doacao;
}

const DadosContext = createContext<Dados | undefined>(undefined);

let sequencia = 100;

const novoId = (prefixo: string) => `${prefixo}${++sequencia}`;

/** "carla.souza" → "Carla" */
function nomeDaEducadora(usuario: string) {
  const primeiro = usuario.trim().split(/[.\s_@-]/)[0] ?? usuario;

  return (
    primeiro.charAt(0).toUpperCase() +
    primeiro.slice(1).toLowerCase()
  );
}

export function DadosProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [educadora, setEducadora] = useState<string | null>(null);
  const [acolhidos] = useState(acolhidosIniciais);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [estoque, setEstoque] = useState(estoqueInicial);
  const [doacoes, setDoacoes] = useState(doacoesIniciais);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);

  const carregarRegistros = useCallback(async () => {
    setCarregando(true);
    setErroCarga(false);

    try {
      const lista = await listarRegistros();
      setRegistros(lista);
    } catch (erro) {
      console.error("Erro ao carregar registros:", erro);
      setErroCarga(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarRegistros();
  }, [carregarRegistros]);

  const valor = useMemo<Dados>(
    () => ({
      educadora,

      entrar: (usuario) => {
        setEducadora(nomeDaEducadora(usuario));
      },

      sair: () => {
        setEducadora(null);
      },

      acolhidos,

      buscarAcolhido: (id) => {
        return acolhidos.find((a) => a.id === id);
      },

      registros,

      adicionarRegistro: async (r) => {
        const salvo = await salvarRegistro({
          ...r,
          autora: educadora ?? "Equipe",
        });

        setRegistros((atual) => [salvo, ...atual]);
      },

      estoque,

      registrarEntrada: ({ nome, quantidade, validade }) => {
        setEstoque((atual) => {
          const existente = atual.find(
            (i) =>
              i.nome.toLowerCase() === nome.trim().toLowerCase()
          );

          if (existente) {
            return atual.map((i) =>
              i.id === existente.id
                ? {
                    ...i,
                    quantidade: i.quantidade + quantidade,
                    validade: validade ?? i.validade,
                  }
                : i
            );
          }

          return [
            ...atual,
            {
              id: novoId("e"),
              nome: nome.trim(),
              quantidade,
              unidade: "un",
              validade,
              minimo: 0,
              categoria: "Outros",
            },
          ];
        });
      },

      doacoes,

      emitirRecibo: (d) => {
        const recibo: Doacao = {
          ...d,
          id: novoId("d"),
          numero:
            doacoes.reduce(
              (max, x) => Math.max(max, x.numero),
              0
            ) + 1,
        };

        setDoacoes((atual) => [recibo, ...atual]);

        return recibo;
      },
    }),
    [educadora, acolhidos, registros, estoque, doacoes]
  );

  if (carregando || erroCarga) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          gap: 16,
        }}
      >
        {carregando ? (
          <>
            <ActivityIndicator size="large" />
            <Text>Carregando registros…</Text>
          </>
        ) : (
          <>
            <Text style={{ textAlign: "center" }}>
              Não foi possível carregar os registros. Verifique
              a conexão e se o servidor está ligado.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => void carregarRegistros()}
              style={{ padding: 16 }}
            >
              <Text>Tentar novamente</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <DadosContext.Provider value={valor}>
      {children}
    </DadosContext.Provider>
  );
}

export function useDados() {
  const ctx = useContext(DadosContext);

  if (!ctx) {
    throw new Error(
      "useDados deve ser usado dentro de <DadosProvider>"
    );
  }

  return ctx;
}