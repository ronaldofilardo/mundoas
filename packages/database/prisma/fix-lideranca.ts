import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("Buscando usuário lider01@asa.com...");
  
  const liderUsuario = await prisma.usuario.findUnique({
    where: { email: "lider01@asa.com" },
  });

  if (!liderUsuario) {
    console.log("Criando usuário lider01@asa.com...");
    const senhaHash = await hash("123456", 12);
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: "Liderança Teste",
        email: "lider01@asa.com",
        senhaHash,
        tipo: "LIDERANCA",
        papel: null,
        senhaTemporaria: false,
        status: "ATIVO",
      },
    });
    console.log("Usuário criado:", novoUsuario.id);
    
    const backoffice = await prisma.backoffice.findFirst();
    if (!backoffice) {
      console.log("Criando backoffice padrão...");
      const backofficeCriado = await prisma.backoffice.create({
        data: {
          usuarioId: novoUsuario.id,
          nome: "Backoffice Padrão",
          cpf: "00000000100",
          percentualComissaoDefault: 5.0,
          percentualComissaoMax: 100.0,
        },
      });
      await prisma.lideranca.create({
        data: {
          usuarioId: novoUsuario.id,
          nome: "Liderança Teste",
          cpf: "00000000200",
          backofficeId: backofficeCriado.id,
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });
      console.log("✅ Liderança criada com backoffice novo");
    } else {
      await prisma.lideranca.create({
        data: {
          usuarioId: novoUsuario.id,
          nome: "Liderança Teste",
          cpf: "00000000200",
          backofficeId: backoffice.id,
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });
      console.log("✅ Liderança criada com backoffice existente");
    }
  } else {
    console.log("Usuário encontrado:", liderUsuario.id, "Tipo:", liderUsuario.tipo);
    
    const lideranca = await prisma.lideranca.findUnique({
      where: { usuarioId: liderUsuario.id },
    });
    
    if (!lideranca) {
      console.log("Criando registro de liderança para usuário existente...");
      const backoffice = await prisma.backoffice.findFirst();
      if (!backoffice) {
        console.log("Criando backoffice padrão...");
        const backofficeCriado = await prisma.backoffice.create({
          data: {
            usuarioId: liderUsuario.id,
            nome: "Backoffice Padrão",
            cpf: "00000000100",
            percentualComissaoDefault: 5.0,
            percentualComissaoMax: 100.0,
          },
        });
        await prisma.lideranca.create({
          data: {
            usuarioId: liderUsuario.id,
            nome: liderUsuario.nome || "Liderança Teste",
            cpf: "00000000200",
            backofficeId: backofficeCriado.id,
            tipo: "COMERCIAL",
            status: "ATIVO",
          },
        });
        console.log("✅ Liderança criada com backoffice novo");
      } else {
        await prisma.lideranca.create({
          data: {
            usuarioId: liderUsuario.id,
            nome: liderUsuario.nome || "Liderança Teste",
            cpf: "00000000200",
            backofficeId: backoffice.id,
            tipo: "COMERCIAL",
            status: "ATIVO",
          },
        });
        console.log("✅ Liderança criada com backoffice existente");
      }
    } else {
      console.log("✅ Liderança já existe:", lideranca.id);
    }
  }

  console.log("\n✅ Configuração concluída!");
  console.log("\nDados de acesso:");
  console.log("  Email: lider01@asa.com");
  console.log("  Senha: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });