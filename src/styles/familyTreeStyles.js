export const layoutContainerStyle = {
  height: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'Arial, sans-serif',
};

export const headerStyle = {
  padding: '15px 30px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #e0e0e0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  flexWrap: 'wrap',
  gap: '15px',
};

export const graphContainerStyle = {
  // flexGrow: 1,
  // width: '100%',
  // backgroundColor: '#fafafa',
  width: '100%',
  height: '100vh',
  position: 'relative',
};
export const graphPreviewContainerStyle = {
  // width: '300px',
  // height: '100%',
  // border: '1px solid #ccc',
  // position: 'absolute',
  // right: 0,
  // backgroundColor: 'white'
  height: '100%',
  borderLeft: '1px solid #ccc',
  position: 'absolute',
  top: 0,
  right: 0,
  backgroundColor: 'white',
  transition: 'width 0.3s ease',
  overflow: 'hidden',
};

const pairColors = ['#f94144', '#277da1', '#f3722c', '#43aa8b', '#9e2a2b', '#4d908e'];
const childColor = '#8ac926';
export const defaultCYStyle = [
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
];
