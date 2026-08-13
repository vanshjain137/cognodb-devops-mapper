'use client';
import { useState, useEffect } from 'react';

type Node = { name: string; type: string };

export default function DevOpsMapper() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [affected, setAffected] = useState<Node[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setNodes(data.nodes);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const simulateOutage = async (nodeName: string) => {
    if (!nodeName) {
      setSelectedNode('');
      return;
    }
    
    setSelectedNode(nodeName);
    setAnalyzing(true);
    setAffected([]);
    
    try {
      const res = await fetch(`/api/graph?outage=${encodeURIComponent(nodeName)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAffected(data.affected);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex justify-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-xl w-full border border-red-200">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
          <p className="mt-4 text-sm">Verify your CognoDB credentials in .env.local and ensure the instance is running.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold">Cascading Outage Simulator</h1>
          <p className="text-gray-600 mt-2">
            Select an infrastructure component to visualize the downstream services that will fail.
          </p>
        </header>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            Target Component
          </h2>
          {loading ? (
             <div className="animate-pulse h-12 bg-gray-100 rounded-lg w-full"></div>
          ) : (
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              onChange={(e) => simulateOutage(e.target.value)}
              value={selectedNode}
            >
              <option value="">Select a node to take offline...</option>
              {nodes.map(node => (
                <option key={node.name} value={node.name}>
                  {node.name} ({node.type})
                </option>
              ))}
            </select>
          )}
        </section>

        {selectedNode && (
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[250px]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6 border-b pb-4">
              Impact Analysis: {selectedNode} Down
            </h2>
            
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <svg className="animate-spin mb-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Traversing dependency graph...
              </div>
            ) : affected.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500 bg-green-50 rounded-lg border border-dashed border-green-200">
                No downstream dependencies. This component is safe to take offline.
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {affected.map(app => (
                  <li key={app.name} className="p-4 border border-red-100 bg-red-50 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-red-900">{app.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-red-200 text-red-900 py-1 px-2 rounded-full">
                      {app.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}