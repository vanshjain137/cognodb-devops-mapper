import { NextResponse } from 'next/server';
import { driver } from '@/lib/neo4j';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const outageNode = searchParams.get('outage');
  
  const session = driver.session();
  
  try {
    // If no specific node is passed, return the list of all nodes for the UI dropdown
    if (!outageNode) {
      const result = await session.run(
        `MATCH (n) RETURN n.name AS name, labels(n)[0] AS type ORDER BY name`
      );
      const nodes = result.records.map(record => ({
        name: record.get('name'),
        type: record.get('type')
      }));
      return NextResponse.json({ nodes });
    }

    // MULTI-HOP QUERY: Find all apps that depend (directly or indirectly up to 5 hops) 
    // on the service/database that is experiencing an outage.
    const result = await session.run(
      `MATCH (affected)-[:DEPENDS_ON|DEPLOYED_IN*1..5]->(target {name: $outageNode})
       RETURN DISTINCT affected.name AS name, labels(affected)[0] AS type`,
      { outageNode }
    );
    
    const affected = result.records.map(record => ({
      name: record.get('name'),
      type: record.get('type')
    }));
    
    return NextResponse.json({ affected });
    
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      { error: "Database unreachable or query failed." }, 
      { status: 500 }
    );
  } finally {
    await session.close();
  }
}