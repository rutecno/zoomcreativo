import React, { useState, useEffect } from "react";
import { User, Link2, Upload, Check, Bell, Award, History, Edit3, Trash2 } from "lucide-react";
import { database } from "../utils/database";

export default function UserProfile({ currentUser, onProfileUpdate, activeChallenge, onSubmissionSuccess }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [instagram, setInstagram] = useState(currentUser.instagram);
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatar, setAvatar] = useState(currentUser.avatar || "");
  
  // Submission Form State
  const [submitPhotoBase64, setSubmitPhotoBase64] = useState("");
  const [submitCaption, setSubmitCaption] = useState("");
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // User History & Notifications
  const [mySubmissions, setMySubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [todaySubmission, setTodaySubmission] = useState(null);

  const availableTechniques = [
    "Regla de tercios",
    "Perspectiva a ras de suelo",
    "Luz natural",
    "Modo Pro / Manual",
    "Simetría",
    "Enfoque macro",
    "Blanco y negro",
    "Luz lateral/Contraluz",
    "Espacio negativo"
  ];

  useEffect(() => {
    loadUserData();
  }, [currentUser, activeChallenge]);

  const loadUserData = async () => {
    try {
      // Load user submissions
      let allSubs = [];
      if (activeChallenge) {
        // Find my submissions for today's challenge
        const currentSubs = await database.getSubmissions(activeChallenge.id);
        const mineToday = currentSubs.find(s => s.userEmail.toLowerCase() === currentUser.email.toLowerCase());
        setTodaySubmission(mineToday || null);
      }

      // Load all winners + mock submissions to find personal history
      // Note: for simpler code, we'll scan localStorage zc_submissions directly
      const allSubmissions = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
      const myHistorical = allSubmissions.filter(s => s.userEmail.toLowerCase() === currentUser.email.toLowerCase());
      setMySubmissions(myHistorical);

      // Load notifications
      const notifs = await database.getNotifications(currentUser.email);
      setNotifications(notifs);
    } catch (err) {
      console.error("Error loading user profile data:", err);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await database.updateUserProfile(currentUser.email, {
        name,
        instagram,
        bio,
        avatar
      });
      onProfileUpdate(updated);
      setEditing(false);
    } catch (err) {
      alert("Error al actualizar perfil: " + err.message);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setErrorMsg("La foto es demasiado grande. Elige una de menos de 2.5MB.");
        return;
      }
      setErrorMsg("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmitPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTechToggle = (tech) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(selectedTechs.filter(t => t !== tech));
    } else {
      setSelectedTechs([...selectedTechs, tech]);
    }
  };

  const handleChallengeSubmit = async (e) => {
    e.preventDefault();
    if (!submitPhotoBase64) {
      setErrorMsg("Por favor, selecciona una fotografía para enviar.");
      return;
    }
    if (!submitCaption.trim()) {
      setErrorMsg("Añade una descripción sobre tu captura.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      await database.submitPhoto(
        activeChallenge.id,
        currentUser.email,
        currentUser.name,
        currentUser.instagram,
        submitPhotoBase64,
        submitCaption,
        selectedTechs
      );
      
      // Reset form
      setSubmitPhotoBase64("");
      setSubmitCaption("");
      setSelectedTechs([]);
      
      // Refresh
      await loadUserData();
      onSubmissionSuccess();
      alert("¡Fotografía enviada con éxito! Mucha suerte hoy.");
    } catch (err) {
      setErrorMsg(err.message || "Error al enviar la fotografía.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (id) => {
    await database.markNotificationRead(id);
    await loadUserData();
  };

  return (
    <div className="profile-page-section animate-fade-in">
      <div className="container profile-grid">
        
        {/* Left Column: User Profile Info */}
        <div className="profile-info-column glass-panel">
          <div className="avatar-container">
            {avatar ? (
              <img src={avatar} alt={currentUser.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">{currentUser.name.charAt(0).toUpperCase()}</div>
            )}
            
            {editing && (
              <label className="avatar-upload-overlay">
                <Upload size={18} />
                <span>Subir</span>
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            )}
          </div>

          {!editing ? (
            <div className="profile-details">
              <h2 className="profile-name">{currentUser.name}</h2>
              <span className="profile-role-badge">
                {currentUser.role === "admin" ? "Administrador de Zoom" : "Fotógrafo de Celular"}
              </span>
              
              {currentUser.instagram && (
                <a 
                  href={`https://instagram.com/${currentUser.instagram}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="profile-instagram-link"
                >
                  <Link2 size={14} /> @{currentUser.instagram}
                </a>
              )}

              <p className="profile-bio">
                {currentUser.bio || "Este fotógrafo aún no ha escrito una biografía. ¡Pronto nos compartirá su visión!"}
              </p>

              <div className="profile-stats">
                <div className="stat-box">
                  <span className="stat-num">{mySubmissions.length}</span>
                  <span className="stat-label">Envíos</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{mySubmissions.filter(s => s.isWinner).length}</span>
                  <span className="stat-label">Retos Ganados</span>
                </div>
              </div>

              <button className="btn btn-secondary edit-profile-btn" onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Editar Perfil
              </button>
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="profile-edit-form">
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instagram (sin @)</label>
                <input 
                  type="text" 
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value)} 
                  placeholder="ej. mi_usuario"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sobre Mí (Biografía)</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows="3"
                  placeholder="Comparte qué celular usas y qué tipo de fotografía te apasiona..."
                  className="form-input"
                />
              </div>

              <div className="edit-form-buttons">
                <button type="submit" className="btn btn-primary">Guardar</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Challenge Submission and Notifications */}
        <div className="profile-content-column">
          
          {/* 1. Daily Submission Box */}
          <div className="submission-box-container glass-panel">
            <h3 className="column-section-title">
              <Award size={18} /> Reto Diario Activo
            </h3>
            
            {activeChallenge ? (
              todaySubmission ? (
                // Already submitted today
                <div className="already-submitted-view">
                  <div className="success-badge">
                    <Check size={16} />
                    <span>¡Tu foto ha sido enviada para el reto de hoy!</span>
                  </div>
                  <div className="submitted-photo-preview">
                    <img src={todaySubmission.photoUrl} alt="Tu envío de hoy" />
                    <div className="submitted-photo-info">
                      <h4>Tema: {activeChallenge.theme}</h4>
                      <p>"{todaySubmission.caption}"</p>
                      <div className="submitted-techs">
                        {todaySubmission.techniques.map((t, idx) => (
                          <span key={idx} className="badge badge-gray">{t}</span>
                        ))}
                      </div>
                      <span className="status-indicator">Estado: Esperando deliberación (7:30 PM)</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Form to submit today
                <form onSubmit={handleChallengeSubmit} className="challenge-submit-form">
                  <p className="submit-intro">
                    Sube tu mejor toma para el reto de hoy: <strong>"{activeChallenge.theme}"</strong>.
                  </p>
                  
                  {errorMsg && <p className="form-error-banner">{errorMsg}</p>}

                  <div className="upload-dropzone">
                    {submitPhotoBase64 ? (
                      <div className="upload-preview-container">
                        <img src={submitPhotoBase64} alt="Subida preliminar" className="upload-preview-img" />
                        <button 
                          type="button" 
                          className="btn btn-danger btn-icon remove-upload-btn"
                          onClick={() => setSubmitPhotoBase64("")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="dropzone-label">
                        <Upload size={32} className="upload-icon-pulse" />
                        <span className="upload-label-main">Selecciona o arrastra una fotografía</span>
                        <span className="upload-label-sub">JPG, PNG - Máximo 2.5MB</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUploadChange} 
                          style={{ display: "none" }} 
                        />
                      </label>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Descripción de la Foto</label>
                    <textarea
                      placeholder="Cuéntanos la historia detrás de esta foto, dónde fue tomada o qué te inspiró..."
                      value={submitCaption}
                      onChange={(e) => setSubmitCaption(e.target.value)}
                      rows="2"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Técnicas Implementadas (Móvil)</label>
                    <div className="techniques-checkbox-grid">
                      {availableTechniques.map((tech) => (
                        <button
                          key={tech}
                          type="button"
                          className={`tech-tag-btn ${selectedTechs.includes(tech) ? "active" : ""}`}
                          onClick={() => handleTechToggle(tech)}
                        >
                          {tech}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full" 
                    disabled={submitting}
                  >
                    {submitting ? "Enviando fotografía..." : "Enviar fotografía al reto"}
                  </button>
                </form>
              )
            ) : (
              <p className="no-challenge-msg">No hay retos activos en este momento.</p>
            )}
          </div>

          {/* 2. Notifications Box */}
          <div className="notifications-container glass-panel">
            <h3 className="column-section-title">
              <Bell size={18} /> Bandeja de Notificaciones
            </h3>
            {notifications.length > 0 ? (
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`notification-item ${notif.isRead ? "read" : "unread"}`}>
                    <div className="notif-header">
                      <span className="notif-title">{notif.title}</span>
                      <span className="notif-time">{new Date(notif.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="notif-msg">{notif.message}</p>
                    {!notif.isRead && (
                      <button 
                        className="btn-mark-read" 
                        onClick={() => handleMarkRead(notif.id)}
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-notifs">No tienes notificaciones recibidas.</p>
            )}
          </div>

          {/* 3. Submissions History */}
          <div className="history-container glass-panel">
            <h3 className="column-section-title">
              <History size={18} /> Mis Participaciones
            </h3>
            {mySubmissions.length > 0 ? (
              <div className="submissions-history-grid">
                {mySubmissions.map((sub) => (
                  <div key={sub.id} className="history-card">
                    <img src={sub.photoUrl} alt="Mi envío" className="history-photo" />
                    <div className="history-info">
                      <span className="history-date">{new Date(sub.timestamp).toLocaleDateString()}</span>
                      {sub.isWinner && (
                        <span className="winner-history-tag">
                          🏆 ¡Ganadora del reto!
                        </span>
                      )}
                      <p className="history-caption">"{sub.caption}"</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-history">Aún no has enviado fotos a ningún reto de Zoom Creativo.</p>
            )}
          </div>

        </div>

      </div>

      <style>{`
        .profile-page-section {
          padding-top: calc(var(--nav-height) + 30px);
          padding-bottom: 60px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 32px;
          align-items: start;
        }

        /* Profile Left Info Column */
        .profile-info-column {
          padding: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: sticky;
          top: calc(var(--nav-height) + 20px);
        }

        .avatar-container {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          margin-bottom: 20px;
          border: 3px solid var(--border-glass);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--accent-gradient);
          color: #000;
          font-size: 3rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-upload-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .avatar-container:hover .avatar-upload-overlay {
          opacity: 1;
        }

        .profile-name {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .profile-role-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.1);
          border: 1px solid rgba(242, 153, 74, 0.2);
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 14px;
          text-transform: uppercase;
        }

        .profile-instagram-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .profile-instagram-link:hover {
          color: var(--accent-amber);
        }

        .profile-bio {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          width: 100%;
          border-top: 1px solid var(--border-glass);
          border-bottom: 1px solid var(--border-glass);
          padding: 20px 0;
          margin-bottom: 24px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
        }

        .stat-num {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 4px;
        }

        .edit-profile-btn {
          width: 100%;
        }

        .profile-edit-form {
          width: 100%;
          text-align: left;
        }

        .edit-form-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .edit-form-buttons button {
          flex: 1;
        }

        /* Profile Right Column */
        .profile-content-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .column-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #a0a5b5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Submission Box */
        .submission-box-container {
          padding: 30px;
        }

        .submit-intro {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }

        .form-error-banner {
          background: rgba(235, 87, 87, 0.1);
          color: #eb5757;
          border: 1px solid rgba(235, 87, 87, 0.25);
          padding: 10px 16px;
          border-radius: var(--border-radius-sm);
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .upload-dropzone {
          border: 2px dashed var(--border-glass);
          border-radius: var(--border-radius-md);
          background: rgba(255, 255, 255, 0.01);
          transition: all 0.3s ease;
          margin-bottom: 20px;
          overflow: hidden;
        }

        .upload-dropzone:hover {
          border-color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.02);
        }

        .dropzone-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          cursor: pointer;
          text-align: center;
        }

        .upload-icon-pulse {
          color: var(--text-muted);
          margin-bottom: 12px;
          transition: color 0.3s ease;
        }

        .dropzone-label:hover .upload-icon-pulse {
          color: var(--accent-amber);
        }

        .upload-label-main {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .upload-label-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .upload-preview-container {
          position: relative;
          width: 100%;
          height: 300px;
          background: #000;
        }

        .upload-preview-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .remove-upload-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
        }

        .techniques-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
        }

        .tech-tag-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .tech-tag-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .tech-tag-btn.active {
          background: rgba(242, 153, 74, 0.12);
          border-color: var(--accent-amber);
          color: var(--accent-amber);
          font-weight: 600;
        }

        .w-full {
          width: 100%;
        }

        /* Success & Status states */
        .already-submitted-view {
          text-align: center;
          padding: 10px 0;
        }

        .success-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(46, 204, 113, 0.12);
          color: #2ecc71;
          border: 1px solid rgba(46, 204, 113, 0.2);
          padding: 8px 16px;
          border-radius: var(--border-radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .submitted-photo-preview {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 20px;
          text-align: left;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 16px;
        }

        .submitted-photo-preview img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: var(--border-radius-sm);
        }

        .submitted-photo-info h4 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .submitted-photo-info p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .submitted-techs {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .status-indicator {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--accent-amber);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Notifications style */
        .notifications-container {
          padding: 30px;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notification-item {
          border-left: 3px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.01);
          padding: 14px 18px;
          border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
          transition: all 0.2s ease;
        }

        .notification-item.unread {
          border-left-color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.02);
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .notif-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .notif-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .notif-msg {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .btn-mark-read {
          background: transparent;
          border: none;
          color: var(--accent-amber);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 0;
        }

        .btn-mark-read:hover {
          color: var(--text-primary);
          text-decoration: underline;
        }

        .empty-notifs, .empty-history, .no-challenge-msg {
          color: var(--text-muted);
          font-size: 0.88rem;
          padding: 10px 0;
        }

        /* Submissions History Style */
        .history-container {
          padding: 30px;
        }

        .submissions-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        .history-card {
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.01);
          display: flex;
          flex-direction: column;
        }

        .history-photo {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }

        .history-info {
          padding: 16px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .history-date {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .winner-history-tag {
          align-self: flex-start;
          background: rgba(242, 153, 74, 0.12);
          color: var(--accent-amber);
          border: 1px solid rgba(242, 153, 74, 0.25);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .history-caption {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          font-style: italic;
        }

        @media (max-width: 992px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
          .profile-info-column {
            position: relative;
            top: 0;
          }
          .submitted-photo-preview {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
