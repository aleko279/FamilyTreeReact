import React, { useEffect, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

const FamilyTreeGraph = () => {
  const [elements, setElements] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    //fetch('https://localhost:7261/api/family')
    fetch('https://aleko279.runasp.net/api/family')
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
    const pairColors = ['#f94144', '#277da1', '#f3722c', '#43aa8b', '#9e2a2b', '#4d908e'];
    const childColor = '#8ac926';

    connections.forEach(conn => {
      const target = elements.find(el => el.id === conn.target);
      const source = elements.find(el => el.id === conn.source);
      if (target?.role === 'MergePoint') {
        if (!mergePointToParents[conn.target]) mergePointToParents[conn.target] = [];
        mergePointToParents[conn.target].push(conn.source);
      }
      if (source?.role === 'MergePoint') {
        if (!mergePointToChildren[conn.source]) mergePointToChildren[conn.source] = [];
        mergePointToChildren[conn.source].push(conn.target);
      }
    });

    const parentColorMap = {};
    const childColorMap = {};
    let colorIndex = 0;

    Object.entries(mergePointToParents).forEach(([mergeId, parentIds]) => {
      const colorClass = `pair-color-${colorIndex % pairColors.length}`;
      parentIds.forEach(pid => {
        parentColorMap[pid] = colorClass;
      });
      const children = mergePointToChildren[mergeId] || [];
      children.forEach(cid => {
        childColorMap[cid] = 'child-color';
      });
      colorIndex++;
    });

    const cy = cytoscape({
      container: document.getElementById('cy'),
      boxSelectionEnabled: false,
      autounselectify: false,
      layout: {
        name: 'dagre',
        nodeDimensionsIncludeLabels: true,
        animate: true,
        directed: true,
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            label: 'data(fname)',
            'text-valign': 'center',
            'text-halign': 'center',
            color: '#fff',
            'font-size': 10,
            shape: 'round-rectangle',
            width: 80,
            height: 30,
            'text-wrap': 'wrap',
            'text-max-width': 70,
            'border-width': 2,
            'border-color': '#999',
          },
        },
        {
          selector: 'node.selected',
          style: {
            'border-color': '#FFD700',
            'border-width': 4,
            'background-color': '#444',
          },
        },
        {
          selector: 'edge',
          style: {
            'curve-style': 'taxi',
            'taxi-direction': 'downward',
            'target-arrow-shape': 'triangle',
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            width: 2,
          },
        },
        {
          selector: 'edge.selected',
          style: {
            'line-color': 'red',
            'target-arrow-color': 'red',
            width: 4,
          },
        },
        ...pairColors.map((color, i) => ({
          selector: `.pair-color-${i}`,
          style: {
            'background-color': color,
          },
        })),
        {
          selector: '.child-color',
          style: {
            'background-color': childColor,
          },
        },
        {
          selector: 'node[role = "MergePoint"]',
          style: {
            width: 1,
            height: 1,
            opacity: 0,
            'background-opacity': 0,
            'border-width': 0,
            label: '',
          },
        },
      ],
      elements: [
        ...elements.map(el => {
          let className = '';
          if (parentColorMap[el.id]) className = parentColorMap[el.id];
          else if (childColorMap[el.id]) className = 'child-color';

          return {
            data: {
              id: el.id,
              fname: el.lname ? `${el.fname}\n${el.lname}` : el.fname,
              role: el.role,
            },
            classes: className,
          };
        }),
        ...connections.map(conn => ({
          data: {
            source: conn.source,
            target: conn.target,
          },
        })),
      ],
    });

    // === Path Selection Logic ===
    let selectedNodes = [];

    const findPathToRoot = (cy, nodeId) => {
      const path = [];
      let current = cy.getElementById(nodeId);

      while (current.incomers('edge').length > 0) {
        const incoming = current.incomers('edge')[0];
        path.push(incoming);
        current = incoming.source();
      }

      return path;
    };

    const findCommonAncestor = (path1, path2) => {
      const set1 = new Set(path1.map(edge => edge.source().id()));
      for (let edge of path2) {
        if (set1.has(edge.source().id())) return edge.source().id();
      }
      return null;
    };

    const trimToAncestor = (path, ancestorId) => {
      const trimmed = [];
      for (let edge of path) {
        trimmed.push(edge);
        if (edge.source().id() === ancestorId) break;
      }
      return trimmed;
    };

    const findDirectLineage = (cy, fromId, toId) => {
      const visited = new Set();
      const path = [];

      const dfs = (currentId) => {
        if (currentId === toId) return true;
        visited.add(currentId);

        const outEdges = cy.getElementById(currentId).outgoers('edge');

        for (let edge of outEdges) {
          const nextId = edge.target().id();
          if (!visited.has(nextId)) {
            path.push(edge);
            if (dfs(nextId)) return true;
            path.pop();
          }
        }

        return false;
      };

      if (dfs(fromId)) return [...path];
      return [];
    };

    const highlightDirectLineage = (cy, id1, id2) => {
      const path1 = findPathToRoot(cy, id1);
      const path2 = findPathToRoot(cy, id2);
      const ancestor = findCommonAncestor(path1, path2);

      if (ancestor) {
        const trimmed1 = trimToAncestor(path1, ancestor);
        const trimmed2 = trimToAncestor(path2, ancestor);
        [...trimmed1, ...trimmed2].forEach(edge => edge.addClass('selected'));
      } else {
        const direct = findDirectLineage(cy, id1, id2);
        if (direct.length > 0) {
          direct.forEach(edge => edge.addClass('selected'));
        } else {
          const reverse = findDirectLineage(cy, id2, id1);
          reverse.forEach(edge => edge.addClass('selected'));
        }
      }
    };

    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeId = node.id();

      if (selectedNodes.length === 2 || selectedNodes.includes(nodeId)) {
        cy.nodes().removeClass('selected');
        cy.edges().removeClass('selected');
        selectedNodes = [];
      }

      if (!selectedNodes.includes(nodeId)) {
        selectedNodes.push(nodeId);
        node.addClass('selected');
      }

      if (selectedNodes.length === 2) {
        const [id1, id2] = selectedNodes;
        highlightDirectLineage(cy, id1, id2);
      }
    });

    return () => cy.destroy();
  }, [elements, connections]);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div id="cy" style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default FamilyTreeGraph;
