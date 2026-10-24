# Acolher

App mobile para a **Nossa Casa** (Criciúma/SC), casa de acolhimento institucional de crianças e adolescentes. O objetivo é substituir os cadernos de papel e os grupos de WhatsApp usados no plantão por um único aplicativo.

> ABP de **Desenvolvimento Mobile** · Engenharia de Software, 5ª fase · SATC 2026.2

## Estado atual

Esta é a **estrutura base** do projeto. Ela tem só a **tela de login**, que valida os campos localmente. Não há backend nem banco de dados nesta versão. A autenticação com a API entra nas próximas sprints.

Protótipo completo (Figma): https://www.figma.com/design/cE8d6YVtWiO9QyuOXTC2aR



## Pré-requisitos

- **Node.js 20 ou mais recente** (https://nodejs.org). Para conferir, rode `node -v`.
- **Git**.
- No celular, o app **Expo Go** (Play Store ou App Store). Outra opção é um emulador Android ou o simulador do iOS.

## Como rodar

### 1. Baixar o projeto

```bash
git clone https://github.com/MaicouHahn/ABP_MOBILE.git
cd acolher
```

### 2. Instalar as dependências

```bash
npm install
```

Esse comando baixa só o que a tela de login usa:

| Pacote | Para que serve na tela de login |
|---|---|
| `expo`, `react`, `react-native` | Base do app React Native com Expo |
| `expo-status-bar` | Deixa a barra de status clara sobre o fundo verde |
| `react-native-safe-area-context` | Respeita o notch e a barra de status do aparelho |
| `@expo/vector-icons` | Ícones de usuário, cadeado, olho e alerta |
| `expo-font` e `@expo-google-fonts/nunito` | Fonte Nunito, a mesma do protótipo |
| `typescript`, `@types/react` (dev) | Tipagem TypeScript |

Em seguida, rode este comando:

```bash
npx expo install --fix
```

Ele ajusta as versões dos pacotes para a versão do Expo instalada. Isso é necessário porque o Expo Go do celular só abre projetos feitos na versão mais recente do SDK. Se o Expo Go reclamar da versão, atualize o SDK e rode o ajuste de novo:

```bash
npx expo install expo@latest
npx expo install --fix
```

### 3. Iniciar

```bash
npx expo start
```

- **Celular:** abra o Expo Go e leia o QR code que aparece no terminal. No Android, a leitura é feita pelo próprio Expo Go; no iPhone, pela câmera. O celular e o computador precisam estar na mesma rede Wi-Fi. Se a rede bloquear a conexão, use `npx expo start --tunnel`.
- **Emulador:** com o emulador aberto, pressione `a` (Android) ou `i` (iOS) no terminal.

Para conferir a tipagem:

```bash
npm run typecheck
```

### Criando do zero (referência)

O projeto foi criado a partir do template em branco com TypeScript. Depois, foram instaladas só as dependências da tela:

```bash
npx create-expo-app@latest acolher --template blank-typescript
cd acolher
npx expo install expo-font @expo-google-fonts/nunito react-native-safe-area-context @expo/vector-icons
```

## Próximos passos

- [ ] API de autenticação (usuário, senha e token JWT)
- [ ] Navegação por abas: Início, Acolhidos, Plantão, Estoque e Doações
- [ ] CRUD de acolhidos
- [ ] Registro rápido e diário do plantão

## Fluxo de trabalho

- A branch `main` é protegida. Cada tarefa é feita em `feature/<nome>` e entra por pull request.
- Commits seguem o padrão *Conventional Commits* (`feat:`, `fix:`, `docs:`).
- Backlog e sprints ficam no GitHub Projects.

## Equipe

| Integrante | Papel |
|---|---|
| _Nome 1_ | Product Owner |
| _Nome 2_ | Scrum Master |
| _Nome 3_ | Desenvolvimento / UX |
| _Nome 4_ | Desenvolvimento |
