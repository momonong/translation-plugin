# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Chrome extension called "Semantic Keyword Extractor" that provides contextual translation and knowledge graph visualization for selected text. The extension combines text translation with semantic analysis using knowledge graphs and supports PDF OCR functionality.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI) v7
- **PDF Processing**: react-pdf + pdf.js
- **Graph Visualization**: react-cytoscapejs + cytoscape
- **OCR**: tesseract.js
- **Routing**: react-router-dom (HashRouter)
- **Build Tool**: Vite with Chrome extension specific configuration

## Architecture

### Extension Structure
- **Background Script** (`extension/background.js`): Handles context menus, message passing
- **Content Script** (`extension/content-script.js`): Handles text selection, floating translation UI
- **React App** (`extension/src/`): Main popup interface with routing
- **Manifest V3** (`extension/manifest.json`): Chrome extension configuration

### Key Components
- **App.tsx**: Main router with three pages (MainPage, PdfUploaderPage, PdfViewerPage)
- **KnowledgeGraph.tsx**: Cytoscape-based graph visualization
- **PdfUploader.tsx**: PDF drag-and-drop with preview functionality
- **RelatedTerms.tsx**: Accordion-based semantic relationship display
- **HighlightedText.tsx**: Text highlighting with keyword interaction

### Build Configuration
- **Dual Entry Points**: `index.html` (main app) and `pdf.html` (PDF viewer)
- **Extension Scripts**: Background, content-script, and config files bundled separately
- **Static Assets**: PDF worker, manifest, and icons copied during build

## Common Development Commands

### Development
```bash
npm run dev                    # Start development server
npm run build                 # Build for production (Chrome extension)
npm run preview              # Preview production build
```

### Code Quality
```bash
npm run lint                  # Run ESLint on TypeScript files
```

### Testing/Development
- Load `dist/` folder as unpacked extension in Chrome for testing
- Use Chrome DevTools for debugging extension components
- Check console logs in both extension popup and content script contexts

## API Integration

- **Base URL**: Configured in `extension/src/config.ts`
- **Endpoints**: 
  - `/api/keywords` - Extract keywords from text
  - `/api/translate` - Contextual translation
  - `/api/related_terms` - Semantic relationship data
  - `/api/graph` - Knowledge graph data
  - `/api/upload_pdf` - PDF upload and processing

## Extension Workflow

1. **Text Selection**: User double-clicks or right-clicks selected text
2. **Translation**: Content script shows floating translation popup
3. **Knowledge Graph**: User clicks "查語意圖譜" to open main app with semantic analysis
4. **PDF Processing**: Separate PDF upload tool with OCR capabilities

## Key Files for Modification

- `extension/src/App.tsx` - Main application routing and state management
- `extension/src/config.ts` - API endpoint configuration
- `extension/background.js` - Context menu and messaging logic
- `extension/content-script.js` - Text selection and floating UI
- `vite.config.ts` - Build configuration for extension assets
- `extension/manifest.json` - Chrome extension permissions and configuration

## Development Notes

- Uses HashRouter for compatibility with Chrome extension pages
- PDF.js worker loaded from bundled assets (`/assets/pdf.worker.min.mjs`)
- Content script injection prevented with `window.contentScriptLoaded` flag
- Material-UI components for consistent styling across all interfaces
- TypeScript strict mode enabled with comprehensive linting rules
