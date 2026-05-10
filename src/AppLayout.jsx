import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans overflow-hidden">
      <Sidebar />
      {/* O <Outlet /> é onde o React Router vai injetar o Dashboard, Settings, etc */}
      <Outlet />
    </div>
  );
}