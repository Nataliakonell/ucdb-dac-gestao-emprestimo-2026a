import dotenv from "dotenv";
dotenv.config();

import app from "./Infrastructure/Server/ExpressApp";

const PORT = process.env.PORT || 5279;

async function start() {
  try {
    app.listen(PORT, () => {
      console.log(`[Server] rodando com sucesso em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor backend:", error);
    process.exit(1);
  }
}

start();
