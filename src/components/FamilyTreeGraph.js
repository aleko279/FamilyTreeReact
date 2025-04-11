import React, { useEffect, useState } from 'react';
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import elk from "cytoscape-elk";
import cola from "cytoscape-cola";
import avsdf from "cytoscape-avsdf";
import cise from "cytoscape-cise";
import coseBilkent from "cytoscape-cose-bilkent";
import fcose from "cytoscape-fcose";

cytoscape.use(dagre);
cytoscape.use(elk);
cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(cise);
cytoscape.use(coseBilkent);
cytoscape.use(fcose);

const theme = {
  euiColorMediumShade: "#999",
  avatarSizing: {
    l: {
      size: 16
    }
  },
  paddingSizes: {
    xs: 4
  }
};

const FamilyTreeGraph = () => {
  const [elements, setElements] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch('http://gisservices.ge:8080/familytreewebapi/api/family')
      .then(response => response.json())
      .then(data => {
        setElements(data.members.$values);
        setConnections(data.relationships.$values);
      });
  }, []);

  useEffect(() => {
    if (!elements.length || !connections.length) return;

    const mergePointToParents = {};
    const mergePointToChildren = {};

    connections.forEach(conn => {
      const target = elements.find(el => el.id === conn.target);
      const source = elements.find(el => el.id === conn.source);
      if (target?.role === "MergePoint") {
        if (!mergePointToParents[conn.target]) mergePointToParents[conn.target] = [];
        mergePointToParents[conn.target].push(conn.source);
      }
      if (source?.role === "MergePoint") {
        if (!mergePointToChildren[conn.source]) mergePointToChildren[conn.source] = [];
        mergePointToChildren[conn.source].push(conn.target);
      }
    });

    const parentColorMap = {};
    const childColorMap = {};
    const pairColors = ["#f94144", "#277da1", "#f3722c", "#43aa8b", "#9e2a2b", "#4d908e"];
    const childColor = "#8ac926";
    let colorIndex = 0;

    Object.entries(mergePointToParents).forEach(([mergeId, parentIds]) => {
      const colorClass = `pair-color-${colorIndex % pairColors.length}`;
      parentIds.forEach(pid => {
        parentColorMap[pid] = colorClass;
      });
      const children = mergePointToChildren[mergeId] || [];
      children.forEach(cid => {
        childColorMap[cid] = "child-color";
      });
      colorIndex++;
    });

    const cy = cytoscape({
      container: document.getElementById("cy"),
      boxSelectionEnabled: false,
      autounselectify: false,
      selectionType: 'single',
      layout: {
        name: "dagre",
        nodeDimensionsIncludeLabels: true,
        animate: false,
        directed: true
      },
      style: [
        {
          selector: 'node[role = "MergePoint"]',
          style: {
            width: 1,
            height: 1,
            opacity: 0,
            "background-opacity": 0,
            "border-width": 0,
            label: ""
          }
        },
        {
          selector: "node",
          style: {
            "background-color": "#999",
            "border-color": "#ddd",
            "border-width": 1,
            color: "#000",
            "font-family": "Inter UI, Segoe UI, Helvetica, Arial, sans-serif",
            "font-size": 8,
            height: theme.avatarSizing.l.size + 10,
            width: 60,
            label: "data(name)",
            "min-zoomed-font-size": 8,
            "overlay-opacity": 0,
            shape: "rectangle",
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": 60
          }
        },
        {
          selector: "edge",
          style: {
            "curve-style": "taxi",
            "taxi-direction": "downward",
            "line-color": theme.euiColorMediumShade,
            "overlay-opacity": 0,
            "target-arrow-color": theme.euiColorMediumShade,
            "target-arrow-shape": "triangle",
            "target-distance-from-node": theme.paddingSizes.xs,
            width: 0.5,
            "source-arrow-shape": "none"
          }
        },
        {
          selector: "edge:selected",
          style: {
            "line-color": "#ff0000",
            "target-arrow-color": "#ff0000",
            width: 2
          }
        },
        ...pairColors.map((color, i) => ({
          selector: `.pair-color-${i}`,
          style: {
            "background-color": color
          }
        })),
        {
          selector: '.child-color',
          style: {
            "background-color": childColor
          }
        }
      ],
      elements: [
        ...elements.map(el => {
          let className = "";
          if (parentColorMap[el.id]) className = parentColorMap[el.id];
          else if (childColorMap[el.id]) className = "child-color";
          return {
            data: {
              id: el.id,
              name: el.name,
              role: el.role
            },
            classes: className
          };
        }),
        ...connections.map(conn => ({
          data: {
            source: conn.source,
            target: conn.target
          }
        }))
      ]
    });

    const redirectEdges = () => {
      cy.edges().forEach(edge => {
        const sourceNode = edge.source();
        const targetNode = edge.target();

        if (sourceNode.data('role') === 'MergePoint') {
          const prev = sourceNode.incomers('[role!="MergePoint"]')[0];
          if (prev) edge.data('source', prev.id());
        }

        if (targetNode.data('role') === 'MergePoint') {
          const next = targetNode.outgoers('[role!="MergePoint"]')[0];
          if (next) edge.data('target', next.id());
        }
      });

      cy.layout({
        name: 'dagre',
        nodeDimensionsIncludeLabels: true,
        animate: true,
        directed: true
      }).run();
    };

    redirectEdges();

    cy.on('add', 'node', redirectEdges);
    cy.on('remove', 'node', redirectEdges);

    cy.on('select', 'edge', (event) => {
      console.log("Selected edge:", event.target.data());
    });

    // Highlight path from grandparent to grandchild
    function highlightPath(startId, endId) {
      cy.edges().unselect(); // Clear any previous selection
      const visited = new Set();
      const pathEdges = [];

      function dfs(currentId) {
        if (currentId === endId) return true;
        visited.add(currentId);

        const outgoingEdges = cy.edges().filter(e => e.source().id() === currentId);
        for (let edge of outgoingEdges) {
          const targetId = edge.target().id();
          if (!visited.has(targetId)) {
            if (dfs(targetId)) {
              pathEdges.push(edge);
              return true;
            }
          }
        }
        return false;
      }

      if (dfs(startId)) {
        pathEdges.forEach(edge => edge.select());
      }
    }

    // Example: Replace with actual IDs from your dataset
    setTimeout(() => {
      highlightPath("grandparentId", "grandchildId");
    }, 1000);

    return () => cy.destroy();
  }, [elements, connections]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "10px", background: "#282c34", color: "white" }}>
        <h3>გენეალოგიური ხე</h3>
      </div>
      <div id="cy" style={{ flexGrow: 1 }}></div>
    </div>
  );
}

export default FamilyTreeGraph ;
