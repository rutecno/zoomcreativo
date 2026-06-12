import React, { useState, useEffect } from "react";
import { Shield, Sparkles, Send, Award, Users, Trash2, CheckCircle2, ChevronRight, Eye } from "lucide-react";
import { database } from "../utils/database";

export default function AdminDashboard({ activeChallenge, onChallengeCreated, onWinnerSelected }) {
  // Navigation tabs in admin
  const [adminTab, setAdminTab] = useState("submissions"); // 'submissions', 'create_challenge', 'users'

  // Create Challenge State
  const [newTheme, setNewTheme] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creatingChallenge, setCreatingChallenge] = useState(false);

  // Today's Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null); // Sub selected for voting

  // Review Criteria State
  const [feedbackComp, setFeedbackComp] = useState("Excelente composición respetando la regla de tercios.");
  const [feedbackTech, setFeedbackTech] = useState("Correcto uso de la compensación de exposición para evitar quemar las luces.");
  const [feedbackCreativity, setFeedbackCreativity] = useState("Propuesta muy original que aporta una visión única del tema diario.");
  const [feedbackLighting, setFeedbackLighting] = useState("Excelente manejo de la luz natural lateral.");
  const [feedbackPerspective, setFeedbackPerspective] = useState("Ángulo a ras de suelo muy acertado para magnificar el sujeto.");
  const [feedbackHandling, setFeedbackHandling] = useState("Se nota un control manual preciso de los parámetros móviles.");
  const [additionalComment, setAdditionalComment] = useState("¡Una captura fantástica que merece ser la foto del día!");

  // Users Management State
  const [users, setUsers] = useState([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [activeChallenge, adminTab]);

  const loadAdminData = async () => {
    try {
      if (adminTab === "submissions" && activeChallenge) {
        const subs = await database.getSubmissions(activeChallenge.id);
        setSubmissions(subs);
      } else if (adminTab === "users") {
        const allUsers = await database.getUsers();
        setUsers(allUsers);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    if (!newTheme.trim() || !newDesc.trim()) return;

    setCreatingChallenge(true);
    try {
      const created = await database.createChallenge(newTheme, newDesc);
      
      // Auto-notify all users about the new challenge
      await database.sendBroadcastNotification(
        "📸 ¡Nuevo Reto Iniciado!",
        `El administrador Ronaldo ha iniciado el reto de hoy: "${newTheme}". Tienes hasta las 7:30 PM para subir tu mejor fotografía.`
      );

      onChallengeCreated(created);
      setNewTheme("");
      setNewDesc("");
      alert("¡Reto del día creado y publicado exitosamente!");
      setAdminTab("submissions");
    } catch (err) {
      alert("Error al crear reto: " + err.message);
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleSelectWinnerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    const confirmWinner = window.confirm(`¿Estás seguro de declarar ganadora la foto de ${selectedSub.userName}?`);
    if (!confirmWinner) return;

    try {
      const feedback = {
        composition: feedbackComp,
        technique: feedbackTech,
        creativity: feedbackCreativity,
        lighting: feedbackLighting,
        perspective: feedbackPerspective,
        mobileHandling: feedbackHandling,
        comment: additionalComment
      };

      await database.selectWinner(selectedSub.id, feedback);
      
      // Send broadcast notification to community
      await database.sendBroadcastNotification(
        "🏆 ¡Tenemos Ganador del Reto!",
        `La fotografía de ${selectedSub.userName} ha sido seleccionada como la destacada del día para el reto "${activeChallenge.theme}". ¡Revisa el portafolio para ver el resultado y enmarcado!`
      );

      alert("¡Ganador seleccionado correctamente!");
      setSelectedSub(null);
      onWinnerSelected();
      loadAdminData();
    } catch (err) {
      alert("Error al seleccionar ganador: " + err.message);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setSendingBroadcast(true);
    try {
      await database.sendBroadcastNotification(broadcastTitle, broadcastMessage);
      alert("¡Anuncio global enviado a toda la comunidad!");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      alert("Error al enviar anuncio: " + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  return (
    <div className="admin-page-section animate-fade-in">
      <div className="container">
        
        {/* Header Title */}
        <div className="admin-header-row">
          <div className="admin-title-box">
            <h2 className="admin-title">
              <Shield size={28} className="shield-icon" />
              Panel de Administración
            </h2>
            <p className="admin-subtitle">Gestiona retos, evalúa las fotos del día y comunícate con el grupo.</p>
          </div>

          {/* Tab Navigation */}
          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${adminTab === "submissions" ? "active" : ""}`}
              onClick={() => setAdminTab("submissions")}
            >
              Evaluación de Fotos ({submissions.length})
            </button>
            <button
              className={`admin-tab-btn ${adminTab === "create_challenge" ? "active" : ""}`}
              onClick={() => setAdminTab("create_challenge")}
            >
              Crear Nuevo Reto
            </button>
            <button
              className={`admin-tab-btn ${adminTab === "users" ? "active" : ""}`}
              onClick={() => setAdminTab("users")}
            >
              Comunidad y Anuncios
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="admin-content-box">
          
          {/* TAB 1: SUBMISSIONS AND EVALUATION */}
          {adminTab === "submissions" && (
            <div className="tab-submissions-view">
              {activeChallenge ? (
                <div className="active-challenge-summary-bar glass-panel">
                  <div>
                    <span className="summary-date">Reto Activo: {activeChallenge.date}</span>
                    <h3>"{activeChallenge.theme}"</h3>
                  </div>
                  <div className="badge badge-amber">En progreso de votación</div>
                </div>
              ) : (
                <div className="no-active-challenge-notice glass-panel">
                  <p>No hay ningún reto activo actualmente. Ve a "Crear Nuevo Reto" para iniciar la dinámica de hoy.</p>
                </div>
              )}

              {submissions.length > 0 ? (
                <div className="submissions-evaluation-grid">
                  
                  {/* Submissions list cards */}
                  <div className="subs-list">
                    <h4>Fotografías Enviadas Hoy</h4>
                    <div className="subs-list-cards">
                      {submissions.map((sub) => (
                        <div 
                          key={sub.id} 
                          className={`sub-eval-card ${selectedSub?.id === sub.id ? "active" : ""} ${sub.isWinner ? "winner-badge-card" : ""}`}
                          onClick={() => setSelectedSub(sub)}
                        >
                          <img src={sub.photoUrl} alt="envio" className="sub-eval-thumb" />
                          <div className="sub-eval-info">
                            <span className="sub-eval-author">{sub.userName}</span>
                            <span className="sub-eval-insta">@{sub.userInstagram || "s/i"}</span>
                            <p className="sub-eval-desc">"{sub.caption.slice(0, 50)}..."</p>
                          </div>
                          <ChevronRight size={16} className="arrow-right-icon" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submission detail & judging form */}
                  <div className="sub-judging-panel glass-panel">
                    {selectedSub ? (
                      <form onSubmit={handleSelectWinnerSubmit} className="judging-form animate-fade-in">
                        <div className="judging-photo-frame">
                          <img src={selectedSub.photoUrl} alt="Seleccionada" className="judging-large-img" />
                        </div>

                        <div className="judging-author-section">
                          <h3>{selectedSub.userName}</h3>
                          <span className="sub-caption-full">"{selectedSub.caption}"</span>
                          
                          <div className="judging-tech-tags">
                            {selectedSub.techniques.map((t, i) => (
                              <span key={i} className="badge badge-gray">{t}</span>
                            ))}
                          </div>
                        </div>

                        {/* Qualitative Evaluation Forms */}
                        <div className="evaluation-fields-box">
                          <h4 className="box-title">Aspectos a Evaluar (Feedback del Ganador)</h4>
                          
                          <div className="form-group">
                            <label className="form-label">1. Composición</label>
                            <input 
                              type="text" 
                              value={feedbackComp} 
                              onChange={(e) => setFeedbackComp(e.target.value)} 
                              required 
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">2. Técnicas Fotográficas</label>
                            <input 
                              type="text" 
                              value={feedbackTech} 
                              onChange={(e) => setFeedbackTech(e.target.value)} 
                              required 
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">3. Creatividad</label>
                            <input 
                              type="text" 
                              value={feedbackCreativity} 
                              onChange={(e) => setFeedbackCreativity(e.target.value)} 
                              required 
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">4. Iluminación</label>
                            <input 
                              type="text" 
                              value={feedbackLighting} 
                              onChange={(e) => setFeedbackLighting(e.target.value)} 
                              required 
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">5. Perspectiva / Manejo de Móvil</label>
                            <input 
                              type="text" 
                              value={feedbackPerspective} 
                              onChange={(e) => setFeedbackPerspective(e.target.value)} 
                              required 
                              className="form-input"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">6. Comentario del Administrador</label>
                            <textarea 
                              value={additionalComment} 
                              onChange={(e) => setAdditionalComment(e.target.value)} 
                              rows="3"
                              required 
                              className="form-input"
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full btn-award-winner">
                          <Award size={18} />
                          Declarar Fotografía Ganadora del Día
                        </button>
                      </form>
                    ) : (
                      <div className="empty-judging-state">
                        <Award size={48} className="empty-judging-icon" />
                        <p>Selecciona una fotografía de la lista de la izquierda para evaluarla y coronar al ganador del día.</p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="no-submissions-box glass-panel">
                  <p>Aún no se han recibido participaciones para el reto activo de hoy.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE CHALLENGE */}
          {adminTab === "create_challenge" && (
            <div className="tab-create-challenge glass-panel animate-fade-in">
              <h3>Publicar Próximo Reto de Fotografía</h3>
              <p className="tab-description">
                Al crear un nuevo reto, el reto anterior (de estar activo) se completará automáticamente. Los usuarios recibirán una notificación y se actualizará la cuenta atrás de envío.
              </p>

              <form onSubmit={handleCreateChallenge} className="create-challenge-form">
                <div className="form-group">
                  <label className="form-label">Temática / Nombre del Reto</label>
                  <input 
                    type="text" 
                    placeholder="ej. Sombras y Siluetas, Macro, Líneas de Fuga..." 
                    value={newTheme} 
                    onChange={(e) => setNewTheme(e.target.value)} 
                    required 
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instrucciones y Descripción del Reto</label>
                  <textarea 
                    placeholder="Describe qué buscas en las capturas, consejos prácticos para composición o iluminación..." 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                    rows="6"
                    required 
                    className="form-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-publish"
                  disabled={creatingChallenge}
                >
                  <Sparkles size={16} />
                  {creatingChallenge ? "Publicando reto..." : "Publicar Reto de Hoy"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: USERS AND BROADCASTS */}
          {adminTab === "users" && (
            <div className="tab-users-view">
              <div className="users-management-grid">
                
                {/* Users List */}
                <div className="users-list-panel glass-panel">
                  <h3>Comunidad Registrada</h3>
                  <div className="users-table-container">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>DNI/Cédula</th>
                          <th>Correo</th>
                          <th>Instagram</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, idx) => (
                          <tr key={idx}>
                            <td className="user-table-name-cell">
                              <div className="user-table-avatar">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{user.name}</span>
                            </td>
                            <td><code className="doc-code">{user.document}</code></td>
                            <td>{user.email}</td>
                            <td>
                              {user.instagram ? (
                                <a 
                                  href={`https://instagram.com/${user.instagram}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="table-insta-link"
                                >
                                  @{user.instagram}
                                </a>
                              ) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Broadcast Panel */}
                <div className="broadcast-panel glass-panel">
                  <h3>
                    <Send size={18} />
                    Enviar Anuncio a la Comunidad
                  </h3>
                  <p className="tab-description">
                    Envía un mensaje instantáneo a la bandeja de notificaciones de todos los fotógrafos registrados en la aplicación.
                  </p>

                  <form onSubmit={handleSendBroadcast} className="broadcast-form">
                    <div className="form-group">
                      <label className="form-label">Título del Anuncio</label>
                      <input 
                        type="text" 
                        placeholder="ej. ¡Reto extendido! o Consejo del Día" 
                        value={broadcastTitle} 
                        onChange={(e) => setBroadcastTitle(e.target.value)} 
                        required 
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cuerpo del Mensaje</label>
                      <textarea 
                        placeholder="Escribe el mensaje detallado para los usuarios..." 
                        value={broadcastMessage} 
                        onChange={(e) => setBroadcastMessage(e.target.value)} 
                        rows="4"
                        required 
                        className="form-input"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={sendingBroadcast}
                    >
                      <Send size={16} />
                      {sendingBroadcast ? "Enviando anuncio..." : "Enviar Anuncio"}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      <style>{`
        .admin-page-section {
          padding-top: calc(var(--nav-height) + 30px);
          padding-bottom: 60px;
        }

        .admin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 30px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 24px;
        }

        .admin-title {
          font-size: 2.2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #ffffff 0%, #a0a5b5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .shield-icon {
          color: var(--accent-amber);
        }

        .admin-subtitle {
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .admin-tabs {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 4px;
        }

        .admin-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 10px 20px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .admin-tab-btn:hover {
          color: var(--text-primary);
        }

        .admin-tab-btn.active {
          background: rgba(242, 153, 74, 0.12);
          color: var(--accent-amber);
        }

        .admin-content-box {
          min-height: 400px;
        }

        /* TAB 1: Evaluation details */
        .active-challenge-summary-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          margin-bottom: 24px;
        }

        .summary-date {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .active-challenge-summary-bar h3 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 4px;
        }

        .submissions-evaluation-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 32px;
          align-items: start;
        }

        .subs-list h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 0.05em;
        }

        .subs-list-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .sub-eval-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          background: rgba(255, 255, 255, 0.01);
          transition: all 0.2s ease;
        }

        .sub-eval-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--text-muted);
        }

        .sub-eval-card.active {
          border-color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.06);
        }

        .sub-eval-thumb {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid var(--border-glass);
        }

        .sub-eval-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          overflow: hidden;
        }

        .sub-eval-author {
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
        }

        .sub-eval-insta {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .sub-eval-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 4px;
        }

        .arrow-right-icon {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }

        .sub-eval-card:hover .arrow-right-icon {
          transform: translateX(3px);
          color: var(--text-primary);
        }

        /* Judging Panel Form */
        .sub-judging-panel {
          padding: 30px;
          min-height: 450px;
          display: flex;
          flex-direction: column;
        }

        .empty-judging-state {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-muted);
          text-align: center;
          padding: 60px;
        }

        .empty-judging-icon {
          color: var(--text-muted);
        }

        .judging-photo-frame {
          width: 100%;
          max-height: 400px;
          background: #000;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          margin-bottom: 24px;
          border: 1px solid var(--border-glass);
        }

        .judging-large-img {
          width: 100%;
          height: 100%;
          max-height: 400px;
          object-fit: contain;
        }

        .judging-author-section {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 20px;
        }

        .judging-author-section h3 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .sub-caption-full {
          font-size: 1rem;
          color: var(--text-secondary);
          font-style: italic;
          display: block;
          margin-bottom: 16px;
        }

        .judging-tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .evaluation-fields-box {
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 24px;
          margin-bottom: 30px;
        }

        .box-title {
          font-size: 0.95rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-glass);
          padding-bottom: 10px;
          letter-spacing: 0.05em;
        }

        .btn-award-winner {
          padding: 16px;
          font-size: 1.05rem;
          border-radius: var(--border-radius-sm);
        }

        /* TAB 2: Create Challenge */
        .tab-create-challenge {
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }

        .tab-create-challenge h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 12px;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .tab-description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .create-challenge-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .btn-publish {
          align-self: flex-start;
          padding: 14px 28px;
        }

        /* TAB 3: Users Community Table */
        .users-management-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
          align-items: start;
        }

        .users-list-panel {
          padding: 30px;
        }

        .users-list-panel h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .users-table-container {
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .users-table th, .users-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-glass);
          font-size: 0.88rem;
        }

        .users-table th {
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .user-table-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .user-table-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-gradient);
          color: #000;
          font-weight: 700;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .doc-code {
          background: rgba(255,255,255,0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          color: var(--accent-amber);
        }

        .table-insta-link {
          color: var(--text-secondary);
        }

        .table-insta-link:hover {
          color: var(--accent-amber);
          text-decoration: underline;
        }

        /* Broadcast box */
        .broadcast-panel {
          padding: 30px;
        }

        .broadcast-panel h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .broadcast-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .no-active-challenge-notice {
          padding: 24px;
          border: 1px dashed rgba(235, 87, 87, 0.3);
          background: rgba(235, 87, 87, 0.02);
          color: #eb5757;
          border-radius: var(--border-radius-sm);
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 24px;
        }

        .no-submissions-box {
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
        }

        @media (max-width: 992px) {
          .admin-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-tabs {
            width: 100%;
            overflow-x: auto;
          }
          .submissions-evaluation-grid, .users-management-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
