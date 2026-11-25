require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');

async function checkConnection() {
  const url = process.env.DATABASE_URL;
  console.log(`\n======================================================`);
  console.log(`🔌 Checking Database Connection...`);
  console.log(`📍 Configured DATABASE_URL in .env:`);
  console.log(`   ${url ? url.replace(/:([^:@]+)@/, ':****@') : 'NOT FOUND'}`);
  console.log(`======================================================\n`);

  if (!url) {
    console.error(`❌ Error: DATABASE_URL is not defined in server/.env`);
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    console.log(`⏳ Connecting to database server...`);
    await prisma.$connect();
    console.log(`✅ Status: CONNECTED SUCCESSFULLY!`);

    const info = await prisma.$queryRaw`
      SELECT 
        1 as status,
        DATABASE() as active_database,
        USER() as connected_user,
        VERSION() as mysql_version
    `;
    console.log(`\n📊 Server Information:`);
    console.log(`   • Active Database: ${info[0].active_database}`);
    console.log(`   • Connected User:  ${info[0].connected_user}`);
    console.log(`   • MySQL Version:   ${info[0].mysql_version}`);

    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    console.log(`\n📑 Tables in Database (${tables.length} total):`);
    if (tables.length === 0) {
      console.log(`   (Database is currently empty. Run 'npx prisma db push' or seed script to populate tables)`);
    } else {
      tables.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.TABLE_NAME}`);
      });
    }

    console.log(`\n======================================================`);
    console.log(`🎉 Connection check completed successfully!`);
    console.log(`======================================================\n`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Status: CONNECTION FAILED!`);
    console.error(`🔴 Error Details:`, error.message);
    console.error(`\n💡 Troubleshooting Tips:`);
    console.error(`   1. If your password contains '@', it MUST be encoded as '%40' in DATABASE_URL.`);
    console.error(`   2. Ensure MySQL server is running (WAMP green icon on port 3306).`);
    console.error(`   3. Verify user privileges on the target database.`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkConnection();
