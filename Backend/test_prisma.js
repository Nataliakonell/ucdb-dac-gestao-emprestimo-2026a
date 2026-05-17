const { PrismaClient } = require('@prisma/client');

async function test() {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log("Connected successfully!");
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log("Tables in database:", tables);
    
    const equipmentsCount = await prisma.equipment.count();
    console.log("Equipments count:", equipmentsCount);
    
    const equipments = await prisma.equipment.findMany();
    console.log("Equipments content:", equipments);

    await prisma.$disconnect();
  } catch (e) {
    console.error("Connection failed:", e);
  }
}
test();
