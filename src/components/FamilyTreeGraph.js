// import React, { useEffect, useState } from 'react';
// import cytoscape from 'cytoscape';
// import dagre from 'cytoscape-dagre';

// cytoscape.use(dagre);

// const FamilyTreeGraph = () => {
//   const [elements, setElements] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [cyInstance, setCyInstance] = useState(null);
//   const [selectedLname, setSelectedLname] = useState('');
//   const [allLnames, setAllLnames] = useState([]);
//   const [filteredCount, setFilteredCount] = useState(0);

//   const [selectedHusband, setSelectedHusband] = useState(null);
//   const [selectedWife, setSelectedWife] = useState(null);

//   const [husbandSearch, setHusbandSearch] = useState('');
//   const [wifeSearch, setWifeSearch] = useState('');

//   useEffect(() => {
//     //fetch('https://localhost:7261/api/FamilyTree/GetFamilyTree')
//       fetch('https://aleko279.runasp.net/api/FamilyTree/GetFamilyTree')
//       //fetch('https://localhost:7261/api/FamilyTree/GetOnlyFamilyTree')
//       .then(response => response.json())
//       .then(data => {
//         setElements(data.members);
//         setConnections(data.relationships);
//         const uniqueLnames = [...new Set(data.members.map(m => m.lname).filter(Boolean))];
//         setAllLnames(uniqueLnames);
//       });
//   }, []);

//   useEffect(() => {
//     if (!husbandSearch) {
//       setSelectedHusband(null);
//       setSelectedWife(null);
//       return;
//     }

//     const foundHusband = elements.find(m =>
//       (m.fname + ' ' + m.lname).toLowerCase().includes(husbandSearch.toLowerCase())
//     );

//     if (foundHusband) {
//       setSelectedHusband(foundHusband);

//       fetch('https://aleko279.runasp.net/api/FamilyTree/GetFamilyTree')
//         .then(response => response.json())
//         .then(data => {
//           const husbandId = foundHusband.id;

//           // მოიძებნოს ყველა MergePoint, სადაც ქმარი მონაწილეობს
//           const husbandMergePoints = data.relationships
//             .filter(r => r.source === husbandId)
//             .map(r => r.target);

//           // მოიძებნოს სხვა პიროვნება იმავე MergePoint-ზე
//           const possibleSpouseRelation = data.relationships.find(r =>
//             husbandMergePoints.includes(r.target) && r.source !== husbandId
//           );

//           if (possibleSpouseRelation) {
//             const wife = data.members.find(m => m.id === possibleSpouseRelation.source);
//             setSelectedWife(wife);
//             setWifeSearch(wife ? `${wife.fname} ${wife.lname}` : '');
//           } else {
//             setSelectedWife(null);
//             setWifeSearch('');
//           }
//         });
//     } else {
//       setSelectedHusband(null);
//       setSelectedWife(null);
//     }
//   }, [husbandSearch, elements]);


//   useEffect(() => {
//     // თავიდანვე აჩვენე სრული რაოდენობა mergePoint-ების გარეშე
//     const initial = elements.filter(m => !m.mergePoint).length;
//     setFilteredCount(initial);
//   }, [elements]);
//   useEffect(() => {
//     if (!connections || !elements) return;
//     if (!elements.length || !connections.length) return;

//     const mergePointToParents = {};
//     const mergePointToChildren = {};
//     const pairColors = ['#f94144', '#277da1', '#f3722c', '#43aa8b', '#9e2a2b', '#4d908e'];
//     const childColor = '#8ac926';

//     connections.forEach(conn => {
//       const target = elements.find(el => el.id === conn.target);
//       const source = elements.find(el => el.id === conn.source);
//       if (target?.role === 'MergePoint') {
//         if (!mergePointToParents[conn.target]) mergePointToParents[conn.target] = [];
//         mergePointToParents[conn.target].push(conn.source);
//       }
//       if (source?.role === 'MergePoint') {
//         if (!mergePointToChildren[conn.source]) mergePointToChildren[conn.source] = [];
//         mergePointToChildren[conn.source].push(conn.target);
//       }
//     });

//     const parentColorMap = {};
//     const childColorMap = {};
//     let colorIndex = 0;

//     Object.entries(mergePointToParents).forEach(([mergeId, parentIds]) => {
//       const colorClass = `pair-color-${colorIndex % pairColors.length}`;
//       parentIds.forEach(pid => {
//         parentColorMap[pid] = colorClass;
//       });
//       const children = mergePointToChildren[mergeId] || [];
//       children.forEach(cid => {
//         childColorMap[cid] = 'child-color';
//       });
//       colorIndex++;
//     });

//     const cy = cytoscape({
//       container: document.getElementById('cy'),
//       boxSelectionEnabled: false,
//       autounselectify: false,
//       layout: {
//         name: 'dagre',
//         nodeDimensionsIncludeLabels: true,
//         animate: true,
//         directed: true,
//       },
//       style: [
//         {
//           selector: 'node',
//           style: {
//             'background-color': '#666',
//             label: 'data(fname)',
//             'text-valign': 'center',
//             'text-halign': 'center',
//             color: '#fff',
//             'font-size': 10,
//             shape: 'round-rectangle',
//             width: 80,
//             height: 30,
//             'text-wrap': 'wrap',
//             'text-max-width': 70,
//             'border-width': 2,
//             'border-color': '#999',
//           },
//         },
//         {
//           selector: 'node.selected',
//           style: {
//             'border-color': '#FFD700',
//             'border-width': 4,
//             'background-color': '#444',
//           },
//         },
//         {
//           selector: 'edge',
//           style: {
//             'curve-style': 'taxi',
//             'taxi-direction': 'downward',
//             'target-arrow-shape': 'triangle',
//             'line-color': '#ccc',
//             'target-arrow-color': '#ccc',
//             width: 2,
//           },
//         },
//         {
//           selector: 'edge.selected',
//           style: {
//             'line-color': 'red',
//             'target-arrow-color': 'red',
//             width: 4,
//           },
//         },
//         ...pairColors.map((color, i) => ({
//           selector: `.pair-color-${i}`,
//           style: {
//             'background-color': color,
//           },
//         })),
//         {
//           selector: '.child-color',
//           style: {
//             'background-color': childColor,
//           },
//         },
//         {
//           selector: 'node[role = "MergePoint"]',
//           style: {
//             width: 1,
//             height: 1,
//             opacity: 0,
//             'background-opacity': 0,
//             'border-width': 0,
//             label: '',
//           },
//         },
//       ],
//       elements: [
//         ...elements.map(el => {
//           let className = '';
//           if (parentColorMap[el.id]) className = parentColorMap[el.id];
//           else if (childColorMap[el.id]) className = 'child-color';

//           return {
//             data: {
//               id: el.id,
//               fname: el.lname ? `${el.fname}\n${el.lname}` : el.fname,
//               role: el.role,
//               lname: el.lname,
//             },
//             classes: className,
//           };
//         }),
//         ...connections.map(conn => ({
//           data: {
//             source: conn.source,
//             target: conn.target,
//           },
//         })),
//       ],
//     });

//     setCyInstance(cy);

//     // === Path Selection Logic ===
//     let selectedNodes = [];

//     const findPathToRoot = (cy, nodeId) => {
//       const path = [];
//       let current = cy.getElementById(nodeId);

//       while (current.incomers('edge').length > 0) {
//         const incoming = current.incomers('edge')[0];
//         path.push(incoming);
//         current = incoming.source();
//       }

//       return path;
//     };

//     const findCommonAncestor = (path1, path2) => {
//       const set1 = new Set(path1.map(edge => edge.source().id()));
//       for (let edge of path2) {
//         if (set1.has(edge.source().id())) return edge.source().id();
//       }
//       return null;
//     };

//     const trimToAncestor = (path, ancestorId) => {
//       const trimmed = [];
//       for (let edge of path) {
//         trimmed.push(edge);
//         if (edge.source().id() === ancestorId) break;
//       }
//       return trimmed;
//     };

//     const findDirectLineage = (cy, fromId, toId) => {
//       const visited = new Set();
//       const path = [];

//       const dfs = (currentId) => {
//         if (currentId === toId) return true;
//         visited.add(currentId);

//         const outEdges = cy.getElementById(currentId).outgoers('edge');

//         for (let edge of outEdges) {
//           const nextId = edge.target().id();
//           if (!visited.has(nextId)) {
//             path.push(edge);
//             if (dfs(nextId)) return true;
//             path.pop();
//           }
//         }

//         return false;
//       };

//       if (dfs(fromId)) return [...path];
//       return [];
//     };

//     const highlightDirectLineage = (cy, id1, id2) => {
//       const path1 = findPathToRoot(cy, id1);
//       const path2 = findPathToRoot(cy, id2);
//       const ancestor = findCommonAncestor(path1, path2);

//       if (ancestor) {
//         const trimmed1 = trimToAncestor(path1, ancestor);
//         const trimmed2 = trimToAncestor(path2, ancestor);
//         [...trimmed1, ...trimmed2].forEach(edge => edge.addClass('selected'));
//       } else {
//         const direct = findDirectLineage(cy, id1, id2);
//         if (direct.length > 0) {
//           direct.forEach(edge => edge.addClass('selected'));
//         } else {
//           const reverse = findDirectLineage(cy, id2, id1);
//           reverse.forEach(edge => edge.addClass('selected'));
//         }
//       }
//     };

//     cy.on('tap', 'node', (event) => {
//       const node = event.target;
//       const nodeId = node.id();

//       if (selectedNodes.length === 2 || selectedNodes.includes(nodeId)) {
//         cy.nodes().removeClass('selected');
//         cy.edges().removeClass('selected');
//         selectedNodes = [];
//       }

//       if (!selectedNodes.includes(nodeId)) {
//         selectedNodes.push(nodeId);
//         node.addClass('selected');
//       }

//       if (selectedNodes.length === 2) {
//         const [id1, id2] = selectedNodes;
//         highlightDirectLineage(cy, id1, id2);
//       }
//     });

//     return () => cy.destroy();
//   }, [elements, connections]);

//   const handleLnameFilter = (lname) => {

//     const filtered = lname
//       ? elements.filter(m => m.lname === lname)
//       : elements;

//     const countWithoutMerge = filtered.filter(m => !m.mergePoint).length;

//     setFilteredCount(countWithoutMerge);

//     setSelectedLname(lname);

//     if (!cyInstance) return;

//     // Hide all nodes and edges initially
//     cyInstance.nodes().forEach(node => node.hide());
//     cyInstance.edges().forEach(edge => edge.hide());

//     if (!lname) {
//       // Show all nodes and edges if no surname is selected
//       cyInstance.nodes().forEach(node => node.show());
//       cyInstance.edges().forEach(edge => edge.show());
//       cyInstance.layout({ name: 'dagre' }).run();
//       return;
//     }

//     const matchingNodes = cyInstance.nodes().filter(n => n.data('lname') === lname);

//     if (matchingNodes.length === 0) return;

//     const findTopAncestor = (node) => {
//       let current = node;
//       while (current.incomers('edge').length > 0) {
//         current = current.incomers('edge')[0].source();
//         if (!current.data('lname') || current.data('lname') !== lname) {
//           break;
//         }
//       }
//       return current;
//     };

//     const topAncestors = matchingNodes.map(findTopAncestor);
//     const uniqueTopAncestors = [...new Set(topAncestors.map(n => n.id()))];

//     const showDescendants = (node) => {
//       node.show();
//       node.outgoers('edge').forEach(edge => {
//         edge.show();
//         const target = edge.target();
//         if (target.data('role') !== 'MergePoint') {
//           target.show();
//           showDescendants(target);
//         }
//       });
//     };

//     uniqueTopAncestors.forEach(id => {
//       const root = cyInstance.getElementById(id);
//       root.show();
//       showDescendants(root);

//       // Additionally, show spouses connected to MergePoints
//       const mergePointConnections = cyInstance.edges().filter(edge => {
//         const sourceNode = edge.source();
//         const targetNode = edge.target();
//         return (sourceNode.id() === id && sourceNode.data('role') === 'MergePoint') ||
//           (targetNode.id() === id && targetNode.data('role') === 'MergePoint');
//       });

//       mergePointConnections.forEach(edge => {
//         edge.show();
//         edge.source().show();
//         edge.target().show();
//       });
//     });

//     cyInstance.layout({ name: 'dagre' }).run();
//   };


// return (
//   <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
//     {/* Header area */}
//     <div
//       style={{
//         padding: '15px 30px',
//         backgroundColor: '#ffffff',
//         borderBottom: '1px solid #e0e0e0',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
//         flexWrap: 'wrap',
//         gap: '15px'
//       }}
//     >
//       {/* Filter */}
//       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//         <label htmlFor="lname-select" style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>ფილტრი:</label>
//         <select
//           id="lname-select"
//           value={selectedLname}
//           onChange={(e) => handleLnameFilter(e.target.value)}
//           style={{
//             padding: '8px 12px',
//             borderRadius: '6px',
//             border: '1px solid #ccc',
//             fontSize: '14px',
//             backgroundColor: '#f9f9f9',
//             outline: 'none',
//           }}
//         >
//           <option value="">ყველა</option>
//           {allLnames.map(name => (
//             <option key={name} value={name}>{name}</option>
//           ))}
//         </select>
//       </div>

//       {/* Search area */}
//       <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           {/* <label style={{ marginBottom: '5px', fontWeight: '500', color: '#333' }}>ქმარი:</label> */}
//           <input
//             type="text"
//             value={husbandSearch}
//             onChange={(e) => setHusbandSearch(e.target.value)}
//             placeholder="მოიძიე ქმარი"
//             style={{
//               padding: '8px 12px',
//               borderRadius: '6px',
//               border: '1px solid #ccc',
//               fontSize: '14px',
//               width: '200px',
//             }}
//           />
//         </div>

//         <div style={{ display: 'flex', flexDirection: 'column' }}>
//           {/* <label style={{ marginBottom: '5px', fontWeight: '500', color: '#333' }}>ცოლი:</label> */}
//           <input
//             type="text"
//             value={wifeSearch}
//             onChange={(e) => setWifeSearch(e.target.value)}
//             placeholder="მოიძიე ცოლი"
//             style={{
//               padding: '8px 12px',
//               borderRadius: '6px',
//               border: '1px solid #ccc',
//               fontSize: '14px',
//               width: '200px',
//             }}
//           />
//         </div>

//         <button
//           disabled={!selectedHusband || !selectedWife}
//           onClick={() => {
//             fetch(`https://aleko279.runasp.net/api/FamilyTree/GetOnlyFamilyTree?spouseId1=${selectedHusband.id}&spouseId2=${selectedWife.id}`)
//               .then(res => res.json())
//               .then(data => {
//                 setElements(data.members);
//                 setConnections(data.relationships);
//               });
//           }}
//           style={{
//             padding: '10px 18px',
//             backgroundColor: selectedHusband && selectedWife ? '#007acc' : '#ccc',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '6px',
//             cursor: selectedHusband && selectedWife ? 'pointer' : 'not-allowed',
//             fontWeight: 'bold',
//             transition: 'background-color 0.3s',
//           }}
//         >
//           ძიება
//         </button>
//       </div>

//       {/* Count */}
//       <div style={{ fontSize: '15px', color: '#444', whiteSpace: 'nowrap' }}>
//         სულ: <strong style={{ color: '#007acc' }}>{filteredCount}</strong> ადამიანი
//       </div>
//     </div>

//     {/* Cytoscape container */}
//     <div id="cy" style={{ flexGrow: 1, width: '100%', backgroundColor: '#fafafa' }}></div>
//   </div>
// );



// };

// export default FamilyTreeGraph;

import React, { useEffect, useState } from 'react';
import Filters from './Filters';
import SearchInputs from './SearchInputs';
import CountDisplay from './CountDisplay';
import { fetchFamilyTree, fetchSpouseData } from '../services/familyTreeService';
import { initializeCytoscape, updateCyOnFilter } from '../cytoscope/setupGraph';

import {
  layoutContainerStyle,
  headerStyle,
  graphContainerStyle,
} from '../styles/familyTreeStyles';
const FamilyTreeGraph = () => {
  const [elements, setElements] = useState([]);
  const [allElements, setAllElements] = useState([]);
  const [connections, setConnections] = useState([]);
  const [cyInstance, setCyInstance] = useState(null);

  const [selectedLname, setSelectedLname] = useState('');
  const [allLnames, setAllLnames] = useState([]);
  const [filteredCount, setFilteredCount] = useState(0);

  const [selectedHusband, setSelectedHusband] = useState(null);
  const [selectedWife, setSelectedWife] = useState(null);

  const [husbandSearch, setHusbandSearch] = useState('');
  const [wifeSearch, setWifeSearch] = useState('');



  useEffect(() => {
    fetchFamilyTree().then(data => {
      setElements(data.members);
      setAllElements(data.members);
      setConnections(data.relationships);
      const uniqueLnames = [...new Set(data.members.map(m => m.lname).filter(Boolean))];
      setAllLnames(uniqueLnames);
    });
  }, []);

  // useEffect(() => {
  //   if (!husbandSearch) {
  //     setSelectedHusband(null);
  //     setSelectedWife(null);
  //     return;
  //   }

  //   const foundHusband = elements.find(m =>
  //     (m.fname + ' ' + m.lname).toLowerCase().includes(husbandSearch.toLowerCase())
  //   );

  //   if (foundHusband) {
  //     setSelectedHusband(foundHusband);
  //     fetchSpouseData(foundHusband.id).then(({ wife, wifeName }) => {
  //       setSelectedWife(wife);
  //       setWifeSearch(wifeName);
  //     });
  //   } else {
  //     setSelectedHusband(null);
  //     setSelectedWife(null);
  //   }
  // }, [husbandSearch, elements]);

  useEffect(() => {
    const count = elements.filter(m => !m.mergePoint).length;
    setFilteredCount(count);
  }, [elements]);

  useEffect(() => {
    if (!elements.length || !connections.length) return;

    // destroy old instance if exists
    if (cyInstance) {
      cyInstance.destroy();
    }

    // create new instance
    const newCy = initializeCytoscape(elements, connections);
    setCyInstance(newCy);

    // არ გჭირდება filter აქ, რადგან elements უკვე გაფილტრულია ან თავიდან ჩაიტვირთა

    return () => {
      if (newCy) {
        newCy.destroy();
      }
    };
  }, [elements, connections]);


  // const handleLnameFilter = (lname) => {
  //   setSelectedLname(lname);
  //   updateCyOnFilter(cyInstance, lname);
  //   const filtered = lname
  //     ? elements.filter(m => m.lname === lname)
  //     : elements;
  //   setFilteredCount(filtered.filter(m => !m.mergePoint).length);
  // };

  const handleLnameFilter = (lname) => {

    const filtered = lname
      ? elements.filter(m => m.lname === lname)
      : elements;

    const countWithoutMerge = filtered.filter(m => !m.mergePoint).length;

    setFilteredCount(countWithoutMerge);

    setSelectedLname(lname);

    if (!cyInstance) return;

    // Hide all nodes and edges initially
    cyInstance.nodes().forEach(node => node.hide());
    cyInstance.edges().forEach(edge => edge.hide());

    if (!lname) {
      // Show all nodes and edges if no surname is selected
      cyInstance.nodes().forEach(node => node.show());
      cyInstance.edges().forEach(edge => edge.show());
      cyInstance.layout({ name: 'dagre' }).run();
      return;
    }

    const matchingNodes = cyInstance.nodes().filter(n => n.data('lname') === lname);

    if (matchingNodes.length === 0) return;

    const findTopAncestor = (node) => {
      let current = node;
      while (current.incomers('edge').length > 0) {
        current = current.incomers('edge')[0].source();
        if (!current.data('lname') || current.data('lname') !== lname) {
          break;
        }
      }
      return current;
    };

    const topAncestors = matchingNodes.map(findTopAncestor);
    const uniqueTopAncestors = [...new Set(topAncestors.map(n => n.id()))];

    const showDescendants = (node) => {
      node.show();
      node.outgoers('edge').forEach(edge => {
        edge.show();
        const target = edge.target();
        if (target.data('role') !== 'MergePoint') {
          target.show();
          showDescendants(target);
        }
      });
    };

    uniqueTopAncestors.forEach(id => {
      const root = cyInstance.getElementById(id);
      root.show();
      showDescendants(root);

      // Additionally, show spouses connected to MergePoints
      const mergePointConnections = cyInstance.edges().filter(edge => {
        const sourceNode = edge.source();
        const targetNode = edge.target();
        return (sourceNode.id() === id && sourceNode.data('role') === 'MergePoint') ||
          (targetNode.id() === id && targetNode.data('role') === 'MergePoint');
      });

      mergePointConnections.forEach(edge => {
        edge.show();
        edge.source().show();
        edge.target().show();
      });
    });

    cyInstance.layout({ name: 'dagre' }).run();
  };
  return (
    <div style={layoutContainerStyle}>
      <div style={headerStyle}>
        <Filters
          allLnames={allLnames}
          selectedLname={selectedLname}
          onFilterChange={handleLnameFilter}
        />
        <SearchInputs
          peopleList={allElements}
          setElements={setElements}
          setConnections={setConnections}
        />
        <CountDisplay count={filteredCount} />
      </div>
      <div id="cy" style={graphContainerStyle}></div>
    </div>
  );
};

export default FamilyTreeGraph;
