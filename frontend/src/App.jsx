import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import './App.css';
import Projects from './pages/Projects';
import Frequentations from './pages/Frequentation';
import Occupation from './pages/Occupation';
import Dashboard from './pages/Dashboard2';
import Settings from './pages/Settings';
import AppLayout from './AppLayout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'frequentation',
        element: <Frequentations />,
      },
      {
        path: 'occupation',
        element: <Occupation />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
