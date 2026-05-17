# 🛠️ SmartResource+ (Resource Buddy)

> Sistema corporativo premium de controle de estoque, fluxo de reservas e empréstimos de equipamentos de TI e audiovisual com foco em segurança por perfis e acessibilidade digital.

---

## 🌟 Funcionalidades Principais

*   **🔒 Autenticação JWT e Perfis de Acesso (RBAC):** Proteção integral de rotas e interfaces. Diferenciação visual e operacional entre **Administradores** e **Colaboradores**.
*   **📂 Controle de Inventário:** Cadastro de equipamentos com suporte a armazenamento de imagens via proxy de upload local robusto.
*   **♿ Acessibilidade Integrada:** Conexão nativa com plugin de acessibilidade VLibras, design responsivo de alto contraste e foco de navegação por teclado adaptado.
*   **🗄️ Migrações de Banco de Dados Automatizadas:** Framework de controle de esquemas nativo e autônomo sobre PostgreSQL.

---

## 📁 Estrutura do Repositório (Monorepo)

O projeto é organizado como um monorepo limpo e isolado para facilitar a manutenção de ambas as aplicações:

```
resource-buddy/
├── Frontend/           <-- Cliente web React + TypeScript + Vite + TailwindCSS + Shadcn
├── Backend/            <-- API REST em Node.js + Express + Prisma ORM + PostgreSQL
├── docker-compose.yml  <-- Configuração Docker para banco de dados PostgreSQL local
├── .gitignore          <-- Ignora recursos recursivamente de ambas as pastas
└── README.md           <-- Guia geral do projeto (este arquivo)
```

---

## 💾 Banco de Dados & Sistema de Migrações (Migrations)

O projeto possui um **sistema de migrações programático, transacional e autônomo** para o banco PostgreSQL. Isso garante que, ao iniciar a aplicação, todas as tabelas necessárias sejam geradas e atualizadas de forma segura e transparente.

### 📁 Estrutura de Arquivos
*   **Scripts SQL:** Localizados em `Backend/src/Infrastructure/Database/Migrations/`
    *   `001_create_equipments.sql` — Estrutura da tabela de inventário de equipamentos.
    *   `002_create_users.sql` — Estrutura da tabela de usuários corporativos.
*   **Registry TypeScript:** Localizado em `Backend/src/Infrastructure/Database/Migrations/index.ts`
    *   Registra e agrupa todas as migrações tipadas que o executável backend carregará e validará na inicialização.

### ⚙️ Como Funciona
1.  **Tabela de Log:** O backend cria automaticamente a tabela `schema_migrations` no PostgreSQL.
2.  **Verificação de Pendências:** Compara as migrações listadas no registry TypeScript contra os registros gravados no banco.
3.  **Execução Transacional (Isolamento ACID):** Caso existam migrações pendentes, o runner abre um bloco `BEGIN` / `COMMIT` para cada script SQL. Se houver falha, executa o `ROLLBACK` garantindo a integridade do banco.
4.  **Marcação de Sucesso:** Registra a migração concluída na tabela `schema_migrations`.

### ➕ Como Criar uma Nova Migração
Se você precisar adicionar ou modificar uma tabela no banco de dados:

1.  Crie um novo arquivo de script SQL ordenado na pasta de migrações, ex: `Backend/src/Infrastructure/Database/Migrations/003_add_sector_to_equipments.sql`.
2.  Insira o comando SQL desejado nele para histórico de logs.
3.  Registre a nova entrada no array exportado em `Backend/src/Infrastructure/Database/Migrations/index.ts`:
    ```typescript
    {
      id: 3,
      name: "003_add_sector_to_equipments",
      sql: `
        ALTER TABLE equipments ADD COLUMN target_sector VARCHAR(100);
      `
    }
    ```
4.  Reinicie o backend. A migração será detectada e executada de forma 100% automática!

---

## 🚀 Como Executar o Projeto Localmente

### 📋 Pré-requisitos
*   **Node.js** (v18 ou superior) instalado.
*   Instância de banco de dados **PostgreSQL** ativa (ou utilize o arquivo `docker-compose.yml` da raiz para subir instantaneamente).
*   Configurar a URL do banco em arquivo `.env` dentro do backend.

---

### 1️⃣ Inicializando o Banco de Dados (Via Docker)

Se preferir utilizar um banco PostgreSQL em contêiner local, execute na raiz do projeto:
```bash
docker-compose up -d
```
*Isso iniciará o PostgreSQL na porta `5432` com as credenciais padrão já prontas para o backend.*

---

### 2️⃣ Inicializando o Backend

1.  Acesse a pasta do backend:
    ```bash
    cd Backend
    ```
2.  Copie o arquivo de exemplo de ambiente e configure suas credenciais se necessário:
    ```bash
    copy .env-exemple .env
    ```
3.  Instale as dependências:
    ```bash
    npm install
    ```
4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    *O console exibirá as mensagens de execução das migrações do banco e a porta ativa `5279`.*

---

### 3️⃣ Inicializando o Frontend

1.  Abra um novo terminal e acesse a pasta do frontend:
    ```bash
    cd Frontend
    ```
2.  Copie o arquivo de exemplo de ambiente:
    ```bash
    copy .env-exemple .env
    ```
3.  Instale as dependências da aplicação React:
    ```bash
    npm install
    ```
4.  Inicie o servidor de desenvolvimento Vite:
    ```bash
    npm run dev
    ```
    *A aplicação estará disponível em `http://localhost:8080` (ou na primeira porta disponível, como `http://localhost:8081`).*

---

## 🧪 Contas Pré-configuradas para Teste Manual

Uma vez online, você pode testar o fluxo de controle de acessos (RBAC) criando contas a partir da tela de registro da aplicação ou efetuando login com estes dois perfis que criamos como exemplo:

*   **Perfil Colaborador (Acesso Comum):**
    *   **E-mail:** `ana.maria@empresa.com`
    *   **Senha:** `password123`
    *   *Comportamento:* Apenas visualiza equipamentos e solicita empréstimos. Os menus administrativos e ações de edição/exclusão estão ocultados da tela.
*   **Perfil Administrador (Acesso Total):**
    *   **E-mail:** `bruno.adm@empresa.com`
    *   **Senha:** `password123`
    *   *Comportamento:* Acesso completo. Cria novos itens, altera status de equipamentos, visualiza abas de aprovação pendente de solicitações e controla as devoluções de toda a organização.
