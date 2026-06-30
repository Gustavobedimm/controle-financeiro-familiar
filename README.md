# Controle Financeiro Familiar

Aplicação Next.js para controle financeiro pessoal/familiar com autenticação Firebase, dados no Cloud Firestore, dashboards mensais, cartões de crédito, compras parceladas, faturas futuras e projeções.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style setup com `components.json`, tokens CSS e utilitário `cn`
- Firebase Authentication
- Cloud Firestore
- Recharts
- Pronto para deploy na Vercel

## Funcionalidades

- Login, cadastro e recuperação de senha com e-mail/senha.
- Criação automática de `householdId` no cadastro.
- Categorias padrão iniciais para o household.
- Dashboard mensal com receitas, despesas fixas, variáveis, cartão, saldo previsto e saldo real.
- CRUD de receitas.
- CRUD de despesas fixas e variáveis.
- CRUD de cartões.
- Cadastro de compras parceladas com geração automática de parcelas futuras.
- Fatura por cartão, mês e ano.
- Marcação de parcelas ou fatura inteira como paga.
- Projeção dos próximos 12 meses.
- Gráficos básicos de categoria, saldo e receitas x despesas.
- Regras do Firestore isolando dados por `householdId`.

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env.local` a partir do exemplo:

```bash
cp .env.local.example .env.local
```

3. Preencha as variáveis do Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

4. No Firebase Console:

- Ative Authentication com provedor E-mail/senha.
- Crie um banco Cloud Firestore.
- Publique as regras em `firestore.rules`.

5. Rode o projeto:

```bash
npm run dev
```

## Emuladores Firebase

O arquivo `firebase.json` já inclui Auth, Firestore e UI. Para usar:

```bash
firebase emulators:start
```

## Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as mesmas variáveis de ambiente do `.env.local`.
4. Rode o deploy padrão da Vercel para Next.js.

## Organização

- `src/app`: rotas do App Router.
- `src/components`: UI, layout, formulários, cards, gráficos e feedback.
- `src/features`: serviços, tipos e hooks por domínio.
- `src/lib/firebase`: configuração Auth/Firestore.
- `src/lib/utils`: moeda, datas, cálculos e validações.
- `src/types`: entidades principais do domínio financeiro.

## Observações

O app já separa regra de negócio dos componentes de tela: operações Firebase ficam em `features/*/services`, cálculos ficam em `src/lib/utils/calculations.ts`, datas em `src/lib/utils/dates.ts` e moeda em `src/lib/utils/currency.ts`.
