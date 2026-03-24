import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BackgroundDecoration } from './components/BackgroundDecoration';
import { LandingPage } from './pages/LandingPage';
import { CitizenSubmit } from './pages/CitizenSubmit';
import { CitizenTrack } from './pages/CitizenTrack';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { DepartmentDashboard } from './pages/DepartmentDashboard';
import { PortalAuth } from './components/PortalAuth';
import { Register } from './pages/Register';
import { Feedback } from './pages/Feedback';
import { UserRole } from './types';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { CitizenLogin } from './pages/CitizenLogin';

import { LeaderboardPage } from './pages/LeaderboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { PublicPortal } from './pages/PublicPortal';
import { CitizenProtectedRoute } from './components/CitizenProtectedRoute';
import { CitizenDashboard } from './pages/CitizenDashboard';

export default function App() {
  return (
    <Router>
      <LanguageProvider>
      <NotificationProvider>
        <div className="min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-800 overflow-x-hidden">
          <BackgroundDecoration />
          <Navbar />
          <main className="animate-in fade-in duration-700 relative z-10">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/citizen" 
                element={
                  <CitizenProtectedRoute>
                    <CitizenSubmit />
                  </CitizenProtectedRoute>
                } 
              />
              <Route path="/track" element={<CitizenTrack />} />
              <Route path="/register" element={<Register />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/citizen-login" element={<CitizenLogin />} />
              <Route 
                path="/citizen-dashboard" 
                element={
                  <CitizenProtectedRoute>
                    <CitizenDashboard />
                  </CitizenProtectedRoute>
                } 
              />

              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route
                path="/reports"
                element={
                  <PortalAuth portalName="Reports Portal" role={UserRole.ADMIN}>
                    <ReportsPage />
                  </PortalAuth>
                }
              />
              <Route path="/public" element={<PublicPortal />} />
              <Route
                path="/admin"
                element={
                  <PortalAuth portalName="Admin Portal" role={UserRole.ADMIN}>
                    <AdminDashboard />
                  </PortalAuth>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PortalAuth portalName="Intelligence Center" role={UserRole.ADMIN}>
                    <AnalyticsDashboard />
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
                <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  PS
                </div>
                <span className="font-bold text-zinc-900">PS-CRM</span>
              </div>
              <p className="text-sm text-zinc-500">
                Smart Public Services CRM &copy; {new Date().getFullYear()}
              </p>
              <div className="mt-2 text-sm">
                <a className="text-emerald-600" href="/public">Public Transparency Portal</a>
              </div>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest mb-2">Build v2.1.0-GATEWAY-SECURED</div>
                <div className="text-xs font-black text-emerald-600 tracking-[0.2em] uppercase">TEAM GOAT</div>
                <div className="text-[10px] font-bold text-zinc-400 tracking-[0.1em] uppercase">Information Technology</div>
                <div className="text-[10px] font-bold text-zinc-400 tracking-[0.1em] uppercase">V.S.B. Engineering College</div>
              </div>
            </div>
          </footer>
        </div>
      </NotificationProvider>
      </LanguageProvider>
    </Router>
  );
}
