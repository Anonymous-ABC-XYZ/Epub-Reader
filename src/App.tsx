// App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BookPage from './BookPage';
import PageViewer from './PageViewer';
import HomePage from './HomePage';

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage />}></Route>
      <Route path="/books" element={<BookPage />} />
      <Route path="/books/view" element={<PageViewer />} />
    </Routes>
  );
}

export default App;

