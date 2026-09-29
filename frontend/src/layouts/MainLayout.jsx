import React from 'react';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';

export const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};
