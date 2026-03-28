declare module 'react-cytoscapejs' {
    import * as React from 'react';
    import { ElementDefinition, Stylesheet, LayoutOptions } from 'cytoscape';
  
    interface CytoscapeComponentProps {
      elements: ElementDefinition[];
      style?: React.CSSProperties;
      layout?: LayoutOptions;
      stylesheet?: Stylesheet[];
      zoom?: number;
      pan?: { x: number; y: number };
      minZoom?: number;
      maxZoom?: number;
      autoungrabify?: boolean;
      autolock?: boolean;
      autounselectify?: boolean;
      boxSelectionEnabled?: boolean;
      className?: string;
      cy?: (cy: any) => void; // 如果你需要拿到 Cytoscape instance
    }
  
    const CytoscapeComponent: React.FC<CytoscapeComponentProps>;
    export default CytoscapeComponent;
  }
  