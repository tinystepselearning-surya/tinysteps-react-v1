# AI Coding Agent Instructions

Welcome to the Tinysteps Online School Web App! This document provides essential guidance for AI coding agents to be productive in this project. Please follow the conventions and workflows outlined below.

## Project Overview

This project is an online school web application designed to support multiple user roles and interactive learning experiences. The primary focus is on teaching kids phonics, grammar, and English through engaging web-based games. The platform also includes features for teachers, parents, learning managers, and administrators to manage user interactions and content.

### Key Technologies
- **React**: Frontend framework for building user interfaces.
- **TypeScript**: Adds static typing to JavaScript.
- **Vite**: Development server and build tool for fast HMR.
- **Tailwind CSS**: Utility-first CSS framework.
- **Firebase**: Backend services for authentication, database, and cloud functions.

### User Roles
- **Kids**: Access interactive games and learning activities.
- **Teachers**: Manage lesson plans and track student progress.
- **Parents**: Monitor their child's learning journey.
- **Learning Managers**: Oversee curriculum and content creation.
- **Admins**: Handle user management and platform settings.

### Directory Structure
- `src/`: Main application code, including components, pages, and utilities.
- `public/`: Static assets like images and HTML files.
- `functions/`: Firebase Cloud Functions for backend logic.
- `app/`: Configuration files and project-level settings.

## Developer Workflows

### Building and Running the Project
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Preview the production build:
   ```bash
   npm run preview
   ```

### Testing
- **Unit Tests**: Add tests in the `src/tests/` directory. Use Jest for testing React components.
- **Linting**: Run ESLint to ensure code quality:
  ```bash
  npm run lint
  ```

### Firebase Integration
- Firebase configuration is initialized in `src/firebase.ts`.
- Cloud Functions are located in the `functions/` directory. Deploy them using:
  ```bash
  firebase deploy --only functions
  ```

## Codebase Conventions

### Component Structure
- Use functional components with hooks.
- Co-locate component-specific styles and tests.
- Follow the naming convention: `ComponentName.tsx`.

### State Management
- Use React Context for global state.
- Use `useState` and `useReducer` for local state.

### Styling
- Use Tailwind CSS for styling. Avoid inline styles.
- Define reusable classes in `src/styles/`.

### TypeScript
- Use strict typing for all components and functions.
- Define shared types in `src/types/`.

## Interactive Games for Kids
- Games are located in `public/phonics-at-home-activities/` and `public/week-1-learning-begins/`.
- Use animations and sound effects to make games engaging.
- Follow accessibility guidelines to ensure usability for all children.

## External Dependencies
- **React Router**: For client-side routing.
- **Firebase**: For authentication and database.
- **ESLint**: For linting and code quality.

## Examples

### Adding a New Component
1. Create a new file in `src/components/`:
   ```tsx
   // ExampleComponent.tsx
   import React from 'react';

   const ExampleComponent: React.FC = () => {
       return <div>Example Component</div>;
   };

   export default ExampleComponent;
   ```
2. Add styles in `src/styles/` if needed.
3. Import and use the component in a page or another component.

### Adding a Firebase Function
1. Create a new file in `functions/src/`:
   ```ts
   import * as functions from 'firebase-functions';

   export const exampleFunction = functions.https.onRequest((req, res) => {
       res.send('Hello from Firebase!');
   });
   ```
2. Deploy the function:
   ```bash
   firebase deploy --only functions
   ```

## Notes
- Always write clear and concise commit messages.
- Follow the existing code style and structure.
- Document any new patterns or workflows in this file.

For any questions or clarifications, refer to the `README.md` or ask the project maintainers.