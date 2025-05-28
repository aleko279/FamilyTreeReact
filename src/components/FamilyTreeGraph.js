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

  useEffect(() => {
    fetchFamilyTree().then(data => {
      setElements(data.members);
      setAllElements(data.members);
      setConnections(data.relationships);
      const uniqueLnames = [...new Set(data.members.map(m => m.lname).filter(Boolean))];
      setAllLnames(uniqueLnames);
    });
  }, []);
  useEffect(() => {
    const count = elements.filter(m => m.role !='MergePoint').length;
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
