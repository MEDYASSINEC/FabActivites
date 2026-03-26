import { useState } from 'react'
import './App.css'
import Projects from './pages/Projects'
import { Route, Routes } from 'react-router';
import Header from './components/Header';
import Frequentations from './pages/Frequentation';
import Occupation from './pages/Occupation';
import Dashboard from './pages/Dashboard';

function App() {

  return (
    <div className='app'>
      <Header />

      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/projects' element={<Projects />} />
        <Route path='/frequentation' element={<Frequentations />} />
        <Route path='/occupation' element={<Occupation />} />
      </Routes>
      
    </div>
  )
}

export default App
