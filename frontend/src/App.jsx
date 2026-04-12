import { useState } from 'react'
import './App.css'
import Projects from './pages/Projects'
import { Route, Routes } from 'react-router';
import Header from './components/Header';
import Frequentations from './pages/Frequentation';
import Occupation from './pages/Occupation';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

function App() {

  return (
    <div className='app'>
      <Header />

      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/frequentation' element={<Frequentations />} />
        <Route path='/occupation' element={<Occupation />} />
        <Route path='/settings' element={<Settings />} />
      </Routes>
      
    </div>
  )
}

export default App
