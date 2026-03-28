import CytoscapeComponent from "react-cytoscapejs";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import type { Singular } from "cytoscape"; 

interface Node {
  data: { id: string; label: string };
}

interface Edge {
  data: { source: string; target: string; label?: string };
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface RelationItem {
  source: string;
  target: string;
  weight: number;
}


export default function KnowledgeGraph({ term }: { term: string }) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    if (!term) return;

    fetch(`${API_BASE_URL}/api/graph?term=${term}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("後端回傳的 graph 資料:", data);  // <<=== 這裡加
        if (!data || !Array.isArray(data)) return setGraphData({ nodes: [], edges: [] });

        const nodesSet = new Set<string>();
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        data.forEach((group: { relation: string; items: RelationItem[] }) => {
          group.items.forEach((item) => {
            [item.source, item.target].forEach((t) => {
              if (!nodesSet.has(t)) {
                nodesSet.add(t);
                nodes.push({ data: { id: t, label: t } });
              }
            });
            edges.push({
              data: {
                source: item.source,
                target: item.target,
                label: group.relation,
              },
            });
          });
        });

        setGraphData({ nodes, edges });
      })
      .catch((err) => {
        console.error("Failed to fetch graph data", err);
        setGraphData(null);
      });
  }, [term]);

  if (!graphData) return null;

  const elements = [
    ...graphData.nodes.map((node) => ({
      data: { id: node.data.id, label: node.data.label },
    })),
    ...graphData.edges.map((edge) => ({
      data: {
        source: edge.data.source,
        target: edge.data.target,
        label: edge.data.label || "",
      },
    })),
  ];

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const borderColor = isDark ? '#555' : '#ccc';
  const bgColor = isDark ? '#1a1a1a' : '#fff';

  return (
    <div   
      style={{
      width: "100%",
      height: "100%",
      marginTop: "1rem",
      border: `2px solid ${borderColor}`,
      borderRadius: "8px",
      overflow: "hidden",
      backgroundColor: bgColor,
    }}>
      <CytoscapeComponent
        elements={elements}
        style={{ width: "100%", height: "100%" }}
        layout={{
          name: "cose",
          idealEdgeLength: () => 100,
          nodeOverlap: 20,
          componentSpacing: 120,
          nodeRepulsion: () => 400000,
          edgeElasticity: () => 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        }}
        stylesheet={[
          {
            selector: "node",
            style: {
              label: "data(label)",
              backgroundColor: (ele: Singular) =>
                ele.data("label") === term ? "#ff6f61" : "#1976d2",
              color: isDark ? "#e0e0e0" : "#222",
              textValign: "center",
              textHalign: "center",
              fontSize: (ele: Singular) =>
                ele.data("label") === term ? 14 : 11,
              fontWeight: (ele: Singular) =>
                ele.data("label") === term ? "bold" : "normal",            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              lineColor: isDark ? "#555" : "#ccc",
              targetArrowColor: isDark ? "#555" : "#ccc",
              targetArrowShape: "triangle",
              curveStyle: "bezier",
              label: "data(label)",
              fontSize: 9,
              color: isDark ? "#aaa" : "#333",
              textRotation: "autorotate",
              textMarginY: -4,
            },
          },
        ]}
      />
    </div>
  );
}
