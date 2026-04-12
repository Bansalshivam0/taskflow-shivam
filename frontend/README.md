# Zomato TaskFlow UI/UX

This project is the frontend client for the Zomato Assignment. It provides a polished, Jira-inspired Agile sprint planner interface built with React and Vite.

## Architecture & Technology Stack

- **Framework**: React 19 + Vite
- **Routing**: `react-router-dom` v7+
- **Drag and Drop**: `@hello-pangea/dnd` for smooth, accessible Kanban interactions
- **Icons**: `lucide-react`
- **State & Context**: Built-in React Context (`AuthContext`) for auth persistence and state propagation
- **Domain Driven Design**: 
  - `src/components/`: Reusable, generic UI components (Layout, Sidebar)
  - `src/context/`: Domain states (Authentication)
  - `src/pages/`: Domain-driven feature views (Sprint Planner, Project detail, Task Detail, Authentication views)
  - `src/services/`: External integrations (Axios API configuration)

## Design Decisions

### Component Library Choice: "Build Your Own"
While libraries like `shadcn/ui`, `MUI`, and `Chakra UI` are fantastic tools, injecting a new component footprint into this codebase would degrade performance and force a rewrite of existing layouts. **I have elected to build my own design system**. 

The application utilizes a custom, deeply integrated CSS framework (`index.css`) containing:
- Built-in comprehensive Dark Mode & Light Mode CSS variables (toggled via `Sidebar.jsx`)
- Polished, custom components inspired by Atlassian/Jira (lozenges, cards, modals)
- Zero external CSS bloat and granular control over micro-interactions (hover states, focus rings, shadows)

### UI/UX Polish Highlights
- **Responsive Layout**: Designed natively for 1280px desktops while gracefully adapting down to 375px mobile widths via dynamic grid templates and an off-canvas mobile menu navigation.
- **Optimistic UI**: Moving a task card on the Kanban board updates local state immediately for snappy interactions, automatically reverting the state back if the backend fails to process the transition.
- **Persistent Auth**: LocalStorage persistence mechanisms in `AuthContext` seamlessly restore session data eliminating the login screen flash.
- **Error States Visible**: Integrated `react-hot-toast` to provide visible success, error, and system states to users instead of transparent failures.

## Adding React Compiler
The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
