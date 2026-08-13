const neo4j = require('neo4j-driver');
require('dotenv').config({ path: '.env' });

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function seed() {
  const session = driver.session();
  try {
    console.log("Clearing existing data...");
    await session.run('MATCH (n) DETACH DELETE n');

    const cypher = `
      // 1. Create Nodes
      CREATE (portfolio:Service {name: 'React Portfolio Frontend', type: 'Frontend'})
      CREATE (invoiceUI:Service {name: 'Invoice Creator App', type: 'Frontend'})
      CREATE (invoiceAPI:Service {name: 'Node.js Invoice API', type: 'Backend'})
      CREATE (blogUI:Service {name: 'Next.js Blog Frontend', type: 'Frontend'})
      CREATE (blogAPI:Service {name: 'Express User API', type: 'Backend'})
      
      CREATE (cloudinary:Database {name: 'Cloudinary Asset Store', type: 'Storage'})
      CREATE (pg:Database {name: 'PostgreSQL Main DB', type: 'Database'})
      
      CREATE (k8s:Cluster {name: 'Kubernetes Prod Cluster', type: 'Infrastructure'})
      CREATE (vercel:Cluster {name: 'Vercel Edge Network', type: 'Infrastructure'})

      // 2. Define Relationships (Hosting)
      MERGE (portfolio)-[:DEPLOYED_IN]->(vercel)
      MERGE (invoiceUI)-[:DEPLOYED_IN]->(vercel)
      MERGE (blogUI)-[:DEPLOYED_IN]->(vercel)

      MERGE (invoiceAPI)-[:DEPLOYED_IN]->(k8s)
      MERGE (blogAPI)-[:DEPLOYED_IN]->(k8s)
      MERGE (pg)-[:DEPLOYED_IN]->(k8s)

      // 3. Define Relationships (Dependencies)
      MERGE (invoiceUI)-[:DEPENDS_ON]->(invoiceAPI)
      MERGE (invoiceAPI)-[:DEPENDS_ON]->(pg)

      MERGE (blogUI)-[:DEPENDS_ON]->(blogAPI)
      MERGE (blogAPI)-[:DEPENDS_ON]->(pg)
      MERGE (blogAPI)-[:DEPENDS_ON]->(cloudinary)
      MERGE (portfolio)-[:DEPENDS_ON]->(blogAPI)
    `;
    
    await session.run(cypher);
    console.log("Graph seeded successfully! Data is ready.");
  } catch (error) {
    console.error("Error seeding graph:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();