import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Projects from './pages/Projects'
import { Route, Routes } from 'react-router';
import Header from './components/Header';
import Frequentations from './pages/Frequentation';
import Occupation from './pages/Occupation';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function App() {
  const [unsavedByPage, setUnsavedByPage] = useState({
    '/projects': false,
    '/frequentation': false,
    '/occupation': false,
  });

  const hasUnsavedChanges = useMemo(
    () => Object.values(unsavedByPage).some(Boolean),
    [unsavedByPage]
  );

  useEffect(() => {
    const beforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [hasUnsavedChanges]);

  const updateUnsavedForPage = (path, hasChanges) => {
    setUnsavedByPage(prev => ({ ...prev, [path]: hasChanges }));
  };

  return (
    <div className='app'>
      <Header unsavedByPage={unsavedByPage} hasUnsavedChanges={hasUnsavedChanges} />

      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/projects' element={<Projects onUnsavedChange={(hasChanges) => updateUnsavedForPage('/projects', hasChanges)} />} />
        <Route path='/frequentation' element={<Frequentations onUnsavedChange={(hasChanges) => updateUnsavedForPage('/frequentation', hasChanges)} />} />
        <Route path='/occupation' element={<Occupation onUnsavedChange={(hasChanges) => updateUnsavedForPage('/occupation', hasChanges)} />} />
        <Route path='/settings' element={<Settings />} />
      </Routes>
      
    </div>
  )
}

export default App
