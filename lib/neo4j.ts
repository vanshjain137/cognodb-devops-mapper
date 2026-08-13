import neo4j from 'neo4j-driver';

const uri = process.env.NEO4J_URI || 'bolt+s://localhost:7687';
const user = process.env.NEO4J_USER || 'cognodb';
const password = process.env.NEO4J_PASSWORD || '';

export const driver = neo4j.driver(
  uri,
  neo4j.auth.basic(user, password)
);