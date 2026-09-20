import { prisma } from "../src/index";

async function fixPapel() {
  console.log("Fixing papel for gestores...");
  
  // Update Gestor PF
const backoffice = await prisma.usuario.updateMany({
    where: { email: "backoffice@asa.com" },
    data: { papel: "BACKOFFICE" },
  });

  console.log("Updated Backoffice:", backoffice.count);
  
  // Verify
  const userPf = await prisma.usuario.findFirst({
    where: { email: "backoffice@asa.com" },
  });
  console.log("Verified Backoffice - Papel:", userPf?.papel);
  
  await prisma.$disconnect();
}

fixPapel();