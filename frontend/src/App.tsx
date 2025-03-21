import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModerationDemo from './components/ModerationDemo';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/demo" element={<ModerationDemo />} />
        {/* ... existing routes ... */}
      </Routes>
    </Router>
  );
};

export default App; 