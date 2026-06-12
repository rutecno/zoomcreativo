import React, { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";
import { Camera, User, Bell, LogOut, Shield, LogIn } from "lucide-react";
import { database } from "../utils/database";

export default function Navigation({ activeTab, setActiveTab, currentUser, onLogout, toggleAuthModal, unreadNotificationsCount }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navigation ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-container">
        <div className="nav-brand" onClick={() => setActiveTab("inicio")}>
          <img src={logo} alt="Zoom Creativo Logo" className="nav-logo" />
          <div className="brand-text">
            <span className="brand-name">ZOOM CREATIVO</span>
            <span className="brand-tagline">FOTOGRAFÍA MÓVIL</span>
          </div>
        </div>

        <div className="nav-links">
          <button 
            className={`nav-link-btn ${activeTab === "inicio" ? "active" : ""}`}
            onClick={() => setActiveTab("inicio")}
          >
            Inicio
          </button>
          <button 
            className={`nav-link-btn ${activeTab === "portafolio" ? "active" : ""}`}
            onClick={() => setActiveTab("portafolio")}
          >
            Portafolio
          </button>

          {currentUser ? (
            <>
              <button 
                className={`nav-link-btn ${activeTab === "perfil" ? "active" : ""}`}
                onClick={() => setActiveTab("perfil")}
              >
                <User size={16} />
                Mi Perfil
              </button>

              {currentUser.role === "admin" && (
                <button 
                  className={`nav-link-btn admin-badge-btn ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  <Shield size={16} />
                  Panel Admin
                </button>
              )}

              <div className="nav-actions">
                <button 
                  className="nav-action-btn notification-btn"
                  onClick={() => setActiveTab("perfil")} // Redirect to profile where notifications are listed
                  title="Notificaciones"
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span className="notification-badge">{unreadNotificationsCount}</span>
                  )}
                </button>

                <div className="user-profile-summary">
                  <div className="user-info-text">
                    <span className="user-name">{currentUser.name}</span>
                    <span className="user-role">{currentUser.role === "admin" ? "Admin" : "Fotógrafo"}</span>
                  </div>
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="user-avatar-sm" />
                  ) : (
                    <div className="user-avatar-placeholder">{currentUser.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>

                <button 
                  className="nav-action-btn logout-btn" 
                  onClick={onLogout} 
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <button className="btn btn-primary nav-login-btn" onClick={toggleAuthModal}>
              <LogIn size={16} />
              Ingresar
            </button>
          )}
        </div>
      </div>

      <style>{`
        .navigation {
          height: var(--nav-height);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          background: transparent;
          border-bottom: 1px solid transparent;
        }

        .navigation.scrolled {
          background: rgba(8, 8, 10, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-glass);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .nav-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid var(--accent-amber);
          object-fit: cover;
          box-shadow: 0 0 10px rgba(242, 153, 74, 0.3);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: 0.05em;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-tagline {
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.15em;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-link-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-link-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-link-btn.active {
          color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.08);
          font-weight: 600;
        }

        .admin-badge-btn {
          border: 1px solid rgba(242, 153, 74, 0.2);
        }

        .admin-badge-btn.active {
          background: rgba(242, 153, 74, 0.12);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: 8px;
          border-left: 1px solid var(--border-glass);
          padding-left: 20px;
        }

        .nav-action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .nav-action-btn:hover {
          color: var(--text-primary);
        }

        .notification-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
        }

        .notification-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--accent-orange);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid var(--bg-primary);
        }

        .user-profile-summary {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-role {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .user-avatar-sm {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-glass);
        }

        .user-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: #000000;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(235, 87, 87, 0.05);
          color: #eb5757;
        }

        .logout-btn:hover {
          background: rgba(235, 87, 87, 0.15);
          color: #ff4d4d;
        }

        .nav-login-btn {
          padding: 8px 18px;
        }

        @media (max-width: 768px) {
          .brand-tagline, .user-info-text {
            display: none;
          }
          .nav-actions {
            border-left: none;
            padding-left: 0;
            margin-left: 0;
          }
          .nav-link-btn span {
            display: none;
          }
      `}</style>
    </nav>
  );
}

