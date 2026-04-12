import React from 'react';
import { Outlet } from 'react-router';
import Header from './components/Header';
import { DirtyTrackerProvider } from './context/DirtyTrackerContext';

const AppLayout = () => {
  return (
    <DirtyTrackerProvider>
      <div className='app'>
        <Header />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </DirtyTrackerProvider>
  );
};

export default AppLayout;
