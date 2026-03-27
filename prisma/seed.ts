import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create teams
  const team1 = await prisma.team.upsert({
    where: { name: "개발팀" },
    update: {},
    create: { name: "개발팀", sortOrder: 1 },
  });

  const team2 = await prisma.team.upsert({
    where: { name: "기획팀" },
    update: {},
    create: { name: "기획팀", sortOrder: 2 },
  });

  // Create members
  await prisma.member.upsert({
    where: { name_teamId: { name: "홍길동", teamId: team1.id } },
    update: {},
    create: { name: "홍길동", email: "hong@example.com", teamId: team1.id, sortOrder: 1 },
  });

  await prisma.member.upsert({
    where: { name_teamId: { name: "김철수", teamId: team1.id } },
    update: {},
    create: { name: "김철수", email: "kim@example.com", teamId: team1.id, sortOrder: 2 },
  });

  await prisma.member.upsert({
    where: { name_teamId: { name: "이영희", teamId: team2.id } },
    update: {},
    create: { name: "이영희", email: "lee@example.com", teamId: team2.id, sortOrder: 1 },
  });

  // Create products
  const products = ["Product A", "Product B", "Product C"];
  for (let i = 0; i < products.length; i++) {
    await prisma.product.upsert({
      where: { name: products[i] },
      update: {},
      create: { name: products[i], sortOrder: i + 1 },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
