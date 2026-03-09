import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BackgroundDecoration } from './components/BackgroundDecoration';
import { LandingPage } from './pages/LandingPage';
import { CitizenSubmit } from './pages/CitizenSubmit';
import { CitizenTrack } from './pages/CitizenTrack';
import { AdminDashboard } from './pages/AdminDashboard';
import { DepartmentDashboard } from './pages/DepartmentDashboard';
import { PortalAuth } from './components/PortalAuth';
import { Register } from './pages/Register';
import { UserRole } from './types';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
        <BackgroundDecoration />
        <Navbar />
        <main className="animate-in fade-in duration-700 relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/citizen" element={<CitizenSubmit />} />
            <Route path="/track" element={<CitizenTrack />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/admin"
              element={
                <PortalAuth portalName="Admin Portal" role={UserRole.ADMIN}>
                  <AdminDashboard />
                </PortalAuth>
              }
            />
            <Route
              path="/officer"
              element={
                <PortalAuth portalName="Officer Portal" role={UserRole.OFFICER}>
                  <DepartmentDashboard />
                </PortalAuth>
              }
            />
          </Routes>
        </main>

        <footer className="py-12 border-t border-zinc-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-white text-[10px] font-bold">
                PS
              </div>
              <span className="font-bold text-zinc-900">PS-CRM</span>
            </div>
            <p className="text-sm text-zinc-500">
              Smart Public Services CRM &copy; {new Date().getFullYear()}
            </p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="text-xs font-black text-emerald-600 tracking-[0.2em] uppercase">TEAM GOAT</div>
              <div className="text-[10px] font-bold text-zinc-400 tracking-[0.1em] uppercase">Information Technology</div>
              <div className="text-[10px] font-bold text-zinc-400 tracking-[0.1em] uppercase">V.S.B. Engineering College</div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
