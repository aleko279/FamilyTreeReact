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
    // === 👇 ზუმის და პანინგის კონტროლი ===
    zoomingEnabled: true,
    userZoomingEnabled: true,
    wheelSensitivity: 0.3,   // პატარა მნიშვნელობა → უფრო ნაზი ზუმი
    minZoom: 0.1,
    maxZoom: 3,
    panningEnabled: true,
    userPanningEnabled: true,
    autoungrabify: false,
  });

  // === Path Selection Logic ===
  let selectedNodes = [];
const findPathToRoot = (cy, nodeId) => {
  const path = [];
  const visited = new Set();
  const stack = [cy.getElementById(nodeId)];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || current.empty()) continue;
    if (visited.has(current.id())) continue;
    visited.add(current.id());

    // მხოლოდ ზემოთ მდებარე კავშირები (მშობელი → ბავშვი)
    const edges = [...current.incomers('edge')];
    for (let e of edges) {
      const parent = e.source(); // სორსი ყოველთვის მშობელია
      if (!visited.has(parent.id())) {
        path.push(e);
        stack.push(parent);
      }
    }
  }
  return path;
};

  // const findPathToRoot = (cy, nodeId) => {
  //   const path = [];
  //   const visited = new Set();
  //   const stack = [cy.getElementById(nodeId)];

  //   while (stack.length > 0) {
  //     const current = stack.pop();
  //     if (!current || current.empty()) continue;
  //     if (visited.has(current.id())) continue;
  //     visited.add(current.id());

  //     // მოძებნე ყველა შესასვლელი და გამოსასვლელი კავშირი
  //     const edges = [...current.incomers('edge'), ...current.outgoers('edge')];
  //     for (let e of edges) {
  //       const source = e.source();
  //       const target = e.target();

  //       // ვინ არის "მშობელი" — ზოგჯერ შეიძლება იყოს ან source ან target
  //       const parent = source.id() === current.id() ? target : source;
  //       if (!visited.has(parent.id())) {
  //         path.push(e);
  //         stack.push(parent);
  //       }
  //     }
  //   }
  //   return path;
  // };

  const colorizePath = (path) => {
    path.forEach(edge => {
      let gender = edge.source().data('gender');
      if (!gender) gender = edge.target().data('gender'); // fallback
      if (gender === 'ქალი') edge.addClass('maternal');
      else if (gender === 'კაცი') edge.addClass('paternal');
      else edge.addClass('selected');
    });
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

  // აბრუნებს ერთი საფეხურით ზემოთ არსებულ მშობელ(ებ)ს
  const findParents = (cy, nodeId) => {
    const node = cy.getElementById(nodeId);
    if (!node || node.empty()) return [];
    return node.incomers('edge').map(e => e.source().id());
  };

  const highlightDirectLineage = (cy, id1, id2) => {
    cy.edges().removeClass('selected maternal paternal');
    cy.nodes().removeClass('selected');

    const path1 = findPathToRoot(cy, id1);
    const path2 = findPathToRoot(cy, id2);

    const ancestor = findCommonAncestor(path1, path2);

    if (ancestor) {
      const trimmed1 = trimToAncestor(path1, ancestor);
      const trimmed2 = trimToAncestor(path2, ancestor);

      colorizePath(trimmed1);
      colorizePath(trimmed2);

      cy.getElementById(id1).addClass('selected');
      cy.getElementById(id2).addClass('selected');
      cy.getElementById(ancestor).addClass('selected');

      // მონიშნე მხოლოდ ერთი საფეხურით ზემოთ (ბაბუა/ბებია)
      const parents = findParents(cy, ancestor);
      parents.forEach(pId => {
        const parentNode = cy.getElementById(pId);
        parentNode.addClass('selected');

        const connectingEdge = parentNode.outgoers('edge').filter(e => e.target().id() === ancestor);
        colorizePath(connectingEdge);
      });

    } else {
      const kinship = findKinshipPath(cy, id1, id2);
      if (kinship.length > 0) kinship.forEach(edge => edge.addClass('selected'));
    }
  };


  // const highlightDirectLineage = (cy, id1, id2) => {
  //   const path1 = findPathToRoot(cy, id1);
  //   const path2 = findPathToRoot(cy, id2);
  //   const ancestor = findCommonAncestor(path1, path2);

  //   cy.edges().removeClass('selected');
  //   cy.nodes().removeClass('selected');
  //   const grandparents2 = findParents(cy, ancestor);
  //   if (ancestor) {
  //     const trimmed1 = trimToAncestor(path1, ancestor);
  //     const trimmed2 = trimToAncestor(path2, ancestor);
  //     [...trimmed1, ...trimmed2].forEach(edge => edge.addClass('selected'));

  //     // 🔹 ancestor-ის ზემოთ ერთი საფეხურით ამოსვლა — ბაბუა/ბებია
  //     const grandparents = findParents(cy, ancestor);
  //     grandparents.forEach(gpId => {
  //       const gpNode = cy.getElementById(gpId);
  //       gpNode.addClass('selected'); // გამოაჩინე graph-ზე
  //       // ასევე მოინიშნოს ხაზები ბაბუიდან ancestor-მდე
  //       const gpEdges = gpNode.outgoers('edge').filter(e => e.target().id() === ancestor);
  //       gpEdges.forEach(e => e.addClass('selected'));
  //     });

  //     console.log(`Common ancestor: ${ancestor}`);
  //     console.log(`Grandparents: ${grandparents.join(', ')}`);
  //   }
  //   else {
  //     // fallback — თუ საერთო ancestor ვერ იპოვა
  //     const kinship = findKinshipPath(cy, id1, id2);
  //     if (kinship.length > 0) {
  //       kinship.forEach(edge => edge.addClass('selected'));
  //     }
  //   }
  // };

  // ორ ნოდს შორის ნათესაური კავშირის პოვნა — ორმხრივი ძიებით (BFS)
  // დააკალ გაშვება: findKinshipPath(cy, fromId, toId, { debug: true })
  const findKinshipPath = (cy, fromId, toId, { debug = true } = {}) => {
    const normalize = (v) => (v || '').toString().toLowerCase();

    const visited = new Set();
    const queue = [[fromId, []]]; // path is array of edge objects

    if (debug) {
      console.log(`[findKinshipPath] start from=${fromId} to=${toId}`);
    }

    while (queue.length > 0) {
      const [currentId, path] = queue.shift();

      if (currentId === toId) {
        if (debug) console.log('[findKinshipPath] found path (constrained):', path.map(e => e.id()));
        return path;
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = cy.getElementById(currentId);
      if (!node || node.empty()) {
        if (debug) console.log('[findKinshipPath] missing node', currentId);
        continue;
      }

      const role = normalize(node.data('role'));

      // მოიპოვე ყველა იმ edge-სი, რომელიც დაკავშირებულია ამ ნოდთან (both directions)
      const neighborEdges = [
        ...node.outgoers('edge'),
        ...node.incomers('edge'),
      ];

      for (let edge of neighborEdges) {
        const nextNode = edge.source().id() === currentId ? edge.target() : edge.source();
        if (!nextNode || nextNode.empty()) continue;

        const nextId = nextNode.id();
        const nextRole = normalize(nextNode.data('role'));

        // 1) MergePoint -> MergePoint არ გვინდა
        if (role === 'mergepoint' && nextRole === 'mergepoint') {
          if (debug) console.log(`[skip] mergepoint->mergepoint ${currentId} -> ${nextId}`);
          continue;
        }

        // 2) თუ ახლა MergePoint-ზე ვართ, მხოლოდ Child-ს მივყვეთ
        if (role === 'mergepoint' && nextRole !== 'child') {
          if (debug) console.log(`[skip] mergepoint can only go to child ${currentId} -> ${nextId} (nextRole=${nextRole})`);
          continue;
        }

        // 3) თუ შემდეგი არის MergePoint (მშობლიდან გადადიხარ MergePoint-ზე),
        //    დავრწმუნდეთ რომ იმას შეეძლება ბავშვზე გასვლა (აქვს outgoing edge to Child)
        if (nextRole === 'mergepoint') {
          const outEdges = nextNode.outgoers('edge');
          let hasChild = false;
          for (let oe of outEdges) {
            const targ = oe.target();
            if (normalize(targ.data('role')) === 'child') {
              hasChild = true;
              break;
            }
          }
          if (!hasChild) {
            if (debug) console.log(`[skip] target mergepoint has no child ${nextId}`);
            continue;
          }
        }

        if (!visited.has(nextId)) {
          queue.push([nextId, [...path, edge]]);
        }
      } // end for edges
    } // end while

    // თუ constrained ძიება არ მოიტანა შედეგი, ჩავრთავთ relaxed (debug only)
    if (debug) {
      console.log('[findKinshipPath] constrained search failed — trying relaxed search (no role constraints) for diagnostics');
      const visited2 = new Set();
      const q2 = [[fromId, []]];
      while (q2.length > 0) {
        const [curId, p] = q2.shift();
        if (curId === toId) {
          console.log('[findKinshipPath] found path (relaxed):', p.map(e => e.id()));
          return p;
        }
        if (visited2.has(curId)) continue;
        visited2.add(curId);

        const curNode = cy.getElementById(curId);
        if (!curNode || curNode.empty()) continue;
        const neigh = [...curNode.outgoers('edge'), ...curNode.incomers('edge')];
        for (let e of neigh) {
          const nxt = e.source().id() === curId ? e.target() : e.source();
          if (!visited2.has(nxt.id())) q2.push([nxt.id(), [...p, e]]);
        }
      }
      console.log('[findKinshipPath] relaxed search also found nothing');
    }

    return [];
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
  // === DEBUG: შეამოწმე mergePoint 57-ს რა შვილები ჰყავს ===
  console.log(
    '57 out edges:',
    cy.getElementById('57').outgoers('edge').map(e => ({
      id: e.id(),
      target: e.target().id(),
      targetRole: e.target().data('role')
    }))
  );

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
    classes: edge.classes().join(' ')  // <-- edges-საც გაწერე class-ები
  });
});
  // selectedEdges.forEach(edge => {
  //   elements.push({
  //     data: {
  //       id: edge.id(),
  //       source: edge.source().id(),
  //       target: edge.target().id(),
  //     },
  //   });
  // });

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

