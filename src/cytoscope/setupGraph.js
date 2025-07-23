import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {
  defaultCYStyle
} from '../styles/familyTreeStyles';
cytoscape.use(dagre);

const pairColors = ['#f94144', '#277da1', '#f3722c', '#43aa8b', '#9e2a2b', '#4d908e'];
const childColor = '#8ac926';

export const initializeCytoscape = (elements, connections) => {
  if (!elements.length || !connections.length) return null;

  // ოჯახის წერტილებთან კავშირების დამუშავება
  const mergePointToParents = {};
  const mergePointToChildren = {};

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

  // MergePoint ელემენტებისთვის უნიკალური ფერების მინიჭება
  const colorsByMergePoint = {};
  Object.keys(mergePointToParents).forEach((mp, idx) => {
    colorsByMergePoint[mp] = pairColors[idx % pairColors.length];
  });

  const elementsForCy = [];

  // ნოდების დამატება Cytoscape-ში
  elements.forEach(el => {
    let bgColor = '#d1c4e9'; // default ფერი

    if (el.role === 'MergePoint') {
      bgColor = '#8e24aa';
    } else if (el.mergePoint && colorsByMergePoint[el.mergePoint]) {
      bgColor = colorsByMergePoint[el.mergePoint];
    } else if (el.role === 'Child') {
      bgColor = childColor;
    }

    const label = el.fname ? `${el.fname} ${el.lname || ''}` : el.lname || el.id;

    elementsForCy.push({
      data: { id: el.id, label },
      style: {
        'background-color': bgColor,
        'label': label,
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': 12,
      }
    });
  });

  // კავშირების დამატება Cytoscape-ში
  connections.forEach(conn => {
    elementsForCy.push({
      data: {
        id: `${conn.source}_${conn.target}`,
        source: conn.source,
        target: conn.target,
      },
      style: {
        'line-color': '#ccc',
        'width': 1,
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#ccc',
      }
    });
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
  // Cytoscape გრაფის ინიციალიზაცია
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
    style: defaultCYStyle,
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
            lname: el.lname,
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
      renderPreviewFromSelection(cy); // ამოიღებს preview-ს
    }
  });

  return cy;
};

// გვარის მიხედვით ნოდების გაფილტვრა
export const updateCyOnFilter = (cy, lname) => {
  if (!cy) return;
  cy.nodes().forEach(node => {
    const label = node.data('label') || '';
    if (!lname || label.toLowerCase().includes(lname.toLowerCase())) {
      node.style('display', 'element');
    } else {
      node.style('display', 'none');
    }
  });
};

export const renderPreviewFromSelection = (cy) => {
  const selectedEdges = cy.edges('.selected');
  const selectedNodeIds = new Set();

  selectedEdges.forEach(edge => {
    selectedNodeIds.add(edge.source().id());
    selectedNodeIds.add(edge.target().id());
  });

  cy.nodes('.selected').forEach(node => {
    selectedNodeIds.add(node.id());
  });

  if (selectedNodeIds.size === 0) return;

  const elements = [];

  selectedNodeIds.forEach(id => {
    const node = cy.getElementById(id);
    elements.push({
      data: {
        id: node.id(),
        fname: node.data('fname'),
        lname: node.data('lname'),
        role: node.data('role'),
      },
      classes: node.classes().join(' '),
    });
  });

  selectedEdges.forEach(edge => {
    elements.push({
      data: {
        id: edge.id(),
        source: edge.source().id(),
        target: edge.target().id(),
      },
    });
  });

  // preview გრაფის შექმნა
  cytoscape({
    container: document.getElementById('cy-preview'),
    elements,
    layout: {
      name: 'dagre',
      nodeDimensionsIncludeLabels: true,
    },
    //style: cy.style(), // ამუშავებს ყველა სტილს — ფერები, ფორმები, classes
    style: defaultCYStyle
  });
};

