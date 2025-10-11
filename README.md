# DocLens

Assistente de documentos com OCR + LLM. Envie notas fiscais/imagens/PDFs, extraia texto, converse com o conteúdo e faça o download do pacote (OCR + histórico). Frontend em **Next.js** e backend em **NestJS** com **Prisma/PostgreSQL**.

## ✨ Funcionalidades

* **Upload** de imagens (`jpg/png/webp/tiff/bmp`) e **PDFs**
* **OCR** (Tesseract) + extração direta de texto de PDF
* **Chat** com o documento (LLM, respostas em **Markdown**)
* **Histórico** de interações por documento
* **Lista** de documentos por usuário (admin pode filtrar)
* **Download** do pacote (texto OCR + histórico LLM)
* **Excluir** documento (apaga OCR + interações + arquivo no disco)

---

## 🧰 Stack

* **Backend**: NestJS, Prisma ORM, PostgreSQL, Tesseract.js, pdf-parse, Multer
* **LLM**: Gemini
* **Frontend**: Next.js (App Router), Tailwind v4, react-markdown, lucide-react, sonner
* **Testes**: Jest (unit + e2e)

---

## 📚 Documentação de API (Postman)

Coleção com todos os endpoints (Auth, Users, Documents):

**👉 [DocLens – Postman Collection](https://www.postman.com/workupback-team/workspace/doclens-workspace/collection/32472747-7822730f-3756-4fb6-9492-43ccaab4f15c?action=share&creator=32472747)**

---

## ⚙️ Pré-requisitos

* **Node.js** ≥ 18
* **PostgreSQL** ≥ 13
* **Tesseract OCR** (com línguas `eng` e `por`)
* **Poppler** (binário `pdftoppm` no PATH) — usado para rasterizar PDFs em imagens
* **Git**
---

## 🚀 Quickstart

### 1) Clone

```bash
git clone https://github.com/LucasKiller/DocLens.git
cd DocLens
```

### 2) Suba o **Backend**

```bash
cd backend
npm install
# crie a .env (modelo abaixo)
# inicialize prisma + banco
npx prisma generate
npx prisma migrate dev -n "init"
npm run start:dev
```

### 3) Suba o **Frontend**

```bash
cd ../frontend
npm install
# crie a .env.local (modelo abaixo)
npm run dev
```

Acesse: **[http://localhost:3001](http://localhost:3001)**

---

## 🔐 Variáveis de Ambiente

### Backend (`backend/.env`)

```dotenv
# App
NODE_ENV=DEV # PROD | TEST
PORT=3000
UPLOAD_DIR=./uploads

# Database
DATABASE_URL=postgresql://postgres:imtdb@localhost:5432/doclens
DATABASE_URL_TEST=postgresql://postgres:imtdb@localhost:5432/doclens_test

# Auth (JWT)
JWT_SECRET=doCzHVlbFmpI2ktGEBeAYMsS8auy1w0I 
JWT_EXPIRES=15m

# OCR (tesseract.js)
OCR_LANGS=eng+por   # idiomas do OCR

# LLM
GEMINI_API_KEY=chave-api
LLM_MODEL=gemini-2.5-flash-lite
LLM_MAX_TOKENS=400
```

> **chave-api:** gere uma **api key** no site [AI Studio](https://aistudio.google.com/api-keys) da Google

### Frontend (`frontend/.env.local`)

```dotenv
# backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ Banco & Prisma

* O schema usa IDs **UUID** para `User`, `Document`, `LlmInteraction`.
* Relacionamentos configurados com **onDelete: Cascade** (apagar documento apaga OCR + interações).
* Comandos úteis:

```bash
# dentro de backend/
npx prisma generate
npx prisma migrate dev -n "nome-da-migracao"
npx prisma studio
```

---

## 🖥️ Rodando o Backend (NestJS)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

**Scripts** comuns (package.json):

* `start:dev` – Nest em modo watch
* `test` – unit tests
* `test:e2e` – end-to-end
* `lint` – linting

### Criar usuário & autenticar

1. **Cadastrar** (POST `/auth/register`) – email, nome, senha
2. **Login** (POST `/auth/login`) → retorna `access_token` (JWT)
3. **Promover** para ADMIN (se necessário) – Use o prisma studio para criar o seu primeiro user ADMIN

---

## 🎨 Rodando o Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

* Na home:

  * Botões **Entrar** / **Cadastrar** (modais).
  * Após login, aparece **“Olá {nome}”** no canto esquerdo.
  * **Upload** com feedback (barra animada + toasts).
  * **Lista** de documentos do usuário.
  * **Ver** → abre modal grande:

    * **Topo**: nome do arquivo, status, botões **Baixar** e **Apagar**.
    * **Área 1**: texto **OCR** (scroll).
    * **Área 2**: **Histórico** do LLM (scroll) — respostas em **Markdown** com highlight.
    * **Rodapé**: **chat** fixo (perguntar/receber respostas, histórico salvo).

> O frontend consome as APIs do backend usando `NEXT_PUBLIC_BACKEND_URL`.

---

## 🧪 Testes

### Backend

```bash
cd backend
npm run test         # unit
npm run test:e2e     # e2e
```

* e2e usa **Supertest**.
* Para CI, configure a base de dados (Postgres) no workflow ou use um serviço de teste (container).

---

## 🗂️ Estrutura (resumo)

```
└── 📁DocLens
    └── 📁.github
        └── 📁workflows
            ├── backend-ci.yml
        ├── dependabot.yml
    └── 📁backend
        └── 📁prisma
            └── 📁migrations
                └── 📁20251006234850_init
                    ├── migration.sql
                └── 📁20251008130640_relations_user_inverse_and_setnull
                    ├── migration.sql
                ├── migration_lock.toml
            ├── schema.prisma
        └── 📁src
            └── 📁auth
                └── 📁dto
                    ├── login.dto.ts
                └── 📁jwt-auth
                    ├── jwt-auth.guard.ts
                └── 📁jwt.strategy
                    ├── jwt.strategy.ts
                └── 📁local.strategy
                    ├── local.strategy.ts
                └── 📁roles
                    ├── roles.guard.ts
                ├── auth.controller.ts
                ├── auth.module.ts
                ├── auth.service.ts
                ├── roles.decorator.ts
            └── 📁documents
                └── 📁dto
                    ├── ask.dto.ts
                    ├── create-document.dto.ts
                ├── documents.controller.ts
                ├── documents.module.ts
                ├── documents.service.ts
            └── 📁llm
                ├── llm.module.ts
                ├── llm.service.ts
            └── 📁ocr
                └── 📁providers
                    ├── ocr.tesseract.ts
                    ├── pdf.utils.ts
                ├── ocr.module.ts
                ├── ocr.service.ts
            └── 📁prisma
                ├── prisma.module.ts
                ├── prisma.service.ts
            └── 📁storage
                ├── storage.module.ts
                ├── storage.service.ts
            └── 📁users
                └── 📁dto
                    ├── create-user.dto.ts
                    ├── role.enum.ts
                    ├── update-user.dto.ts
                └── 📁entities
                    ├── user.entity.ts
                ├── users.controller.spec.ts
                ├── users.controller.ts
                ├── users.http
                ├── users.module.ts
                ├── users.service.spec.ts
                ├── users.service.ts
            ├── app.controller.spec.ts
            ├── app.controller.ts
            ├── app.module.ts
            ├── app.service.ts
            ├── main.ts
        └── 📁test
            ├── auth-and-users.e2e-spec.ts
            ├── jest-e2e.json
        └── 📁uploads
            ├── b671b587ca82483fab6f2727cef8e022.pdf
        ├── .env
        ├── .env.example
        ├── .gitignore
        ├── .prettierrc
        ├── eslint.config.mjs
        ├── nest-cli.json
        ├── openapi.json
        ├── package-lock.json
        ├── package.json
        ├── README.md
        ├── tsconfig.build.json
        ├── tsconfig.json
    └── 📁frontend
        └── 📁public
            ├── file.svg
            ├── globe.svg
            ├── next.svg
            ├── vercel.svg
            ├── window.svg
        └── 📁src
            └── 📁app
                ├── favicon.ico
                ├── globals.css
                ├── layout.tsx
                ├── page.tsx
            └── 📁components
                ├── auth-bar.tsx
                ├── auth-modals.tsx
                ├── chat-panel.tsx
                ├── document-detail.tsx
                ├── documents-list.tsx
                ├── markdown.tsx
                ├── modal.tsx
                ├── upload-card.tsx
                ├── user-greeting.tsx
            └── 📁lib
                ├── api.ts
        ├── .env
        ├── .env.example
        ├── .gitignore
        ├── eslint.config.mjs
        ├── next-env.d.ts
        ├── next.config.ts
        ├── package-lock.json
        ├── package.json
        ├── postcss.config.mjs
        ├── README.md
        ├── tsconfig.json
    └── LICENSE
    └── README.md
```

## 👾 Desenvolvido por
- [Lucas Galhardo](https://github.com/LucasKiller)
