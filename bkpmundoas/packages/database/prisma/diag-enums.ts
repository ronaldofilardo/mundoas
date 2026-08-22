import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const enums = await prisma.$queryRawUnsafe<Array<{ enum_name: string; enum_values: string[] }>>(
    `SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
     FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     JOIN pg_namespace n ON t.typnamespace = n.oid
     WHERE n.nspname = 'public'
     GROUP BY t.typname
     ORDER BY t.typname`
  );

  for (const e of enums) {
    console.log(`${e.enum_name}: [${e.enum_values.join(", ")}]`);
  }
}

main().finally(() => prisma.$disconnect());
