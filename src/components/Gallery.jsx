import React, { useState, useEffect } from "react";
import { Search, Calendar, Award, Heart, Sparkles, Link2, X, Eye, Frame, Trash2 } from "lucide-react";
import { database } from "../utils/database";

export default function Gallery({ winners, onOpenWinnerDetail, onOpenFrameGenerator, onDeleteLocalWinner, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'week', 'month'
  const [filteredWinners, setFilteredWinners] = useState([]);

  useEffect(() => {
    let result = [...winners];

    // Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (w) =>
          w.winnerName.toLowerCase().includes(term) ||
          w.theme.toLowerCase().includes(term) ||
          w.description.toLowerCase().includes(term)
      );
    }

    // Time filter
    const now = new Date();
    if (timeFilter === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((w) => new Date(w.date) >= oneWeekAgo);
    } else if (timeFilter === "month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter((w) => new Date(w.date) >= oneMonthAgo);
    }

    // Sort by date descending
    result.sort((a, b) => b.date.localeCompare(a.date));

    setFilteredWinners(result);
  }, [winners, searchTerm, timeFilter]);

  const handleInteraction = async (e, winnerId, type) => {
    e.stopPropagation(); // Avoid opening the detail modal
    try {
      await database.addInteraction(winnerId, type);
      // Force trigger state reload in parent if necessary, or let it slide (simple UI simulation)
      alert("¡Gracias por apoyar a la comunidad!");
    } catch (err) {
      alert(err.message || "Ya has interactuado con esta foto.");
    }
  };

  return (
    <div className="gallery-section animate-fade-in">
      <div className="container">
        
        {/* Header and filters */}
        <div className="gallery-header-row">
          <div className="section-title-box">
            <span className="badge badge-amber">
              <Award size={12} /> Galería Histórica
            </span>
            <h2 className="section-title">Portafolio de Ganadores</h2>
            <p className="section-subtitle">Las mejores capturas móviles seleccionadas por nuestro panel del grupo.</p>
          </div>

          <div className="filter-controls">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar fotógrafo, tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input search-input"
              />
            </div>

            <div className="filter-tabs">
              <button
                className={`filter-tab-btn ${timeFilter === "all" ? "active" : ""}`}
                onClick={() => setTimeFilter("all")}
              >
                Todos
              </button>
              <button
                className={`filter-tab-btn ${timeFilter === "week" ? "active" : ""}`}
                onClick={() => setTimeFilter("week")}
              >
                Esta Semana
              </button>
              <button
                className={`filter-tab-btn ${timeFilter === "month" ? "active" : ""}`}
                onClick={() => setTimeFilter("month")}
              >
                Este Mes
              </button>
            </div>
          </div>
        </div>

        {/* Grid Feed */}
        {filteredWinners.length > 0 ? (
          <div className="gallery-grid">
            {filteredWinners.map((winner) => (
              <div 
                key={winner.id} 
                className="gallery-card glass-card"
                onClick={() => onOpenWinnerDetail(winner)}
              >
                <div className="card-image-box">
                  {/* Fallback image if local photo fails to load */}
                  <img 
                    src={winner.photoUrl} 
                    alt={winner.theme} 
                    className="card-photo" 
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <div className="card-hover-overlay">
                    <span className="btn btn-secondary btn-icon-only">
                      <Eye size={20} />
                    </span>
                    <button 
                      className="btn btn-primary btn-frame-shortcut"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFrameGenerator(winner);
                      }}
                    >
                      <Frame size={16} /> Enmarcar
                    </button>
                  </div>
                  <div className="card-date-badge">
                    <Calendar size={10} />
                    <span>{winner.date}</span>
                  </div>
                  {isAdmin && (
                    <button 
                      className="card-delete-badge-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("¿Seguro que deseas eliminar este ganador del portafolio?")) {
                          onDeleteLocalWinner(winner.id);
                        }
                      }}
                      title="Eliminar foto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <div className="card-content-box">
                  <span className="card-theme-title">Reto: "{winner.theme}"</span>
                  <div className="card-author-row">
                    <div className="author-details">
                      <span className="author-name">{winner.winnerName}</span>
                      {winner.winnerInstagram && (
                        <a 
                          href={`https://instagram.com/${winner.winnerInstagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="instagram-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link2 size={12} /> @{winner.winnerInstagram}
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="card-caption">
                    {winner.description.slice(0, 85)}
                    {winner.description.length > 85 ? "..." : ""}
                  </p>

                  <div className="card-footer-actions">
                    <div className="social-counters">
                      <button 
                        className="counter-btn" 
                        onClick={(e) => handleInteraction(e, winner.id, "likes")}
                        title="Me gusta"
                      >
                        <Heart size={14} className="icon-heart" />
                        <span>{winner.likes || 0}</span>
                      </button>
                      <button 
                        className="counter-btn" 
                        onClick={(e) => handleInteraction(e, winner.id, "applause")}
                        title="Aplausos"
                      >
                        <Sparkles size={14} className="icon-spark" />
                        <span>{winner.applause || 0}</span>
                      </button>
                    </div>
                    
                    <span className="read-more-indicator">Ver más</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results glass-panel">
            <p>No se encontraron fotografías ganadoras con los filtros actuales.</p>
          </div>
        )}

      </div>

      <style>{`
        .gallery-section {
          padding: 60px 0;
          background: rgba(6, 6, 8, 0.4);
        }

        .gallery-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 2.2rem;
          font-weight: 800;
          margin-top: 8px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #a0a5b5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1rem;
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-bar {
          position: relative;
          min-width: 250px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          padding-left: 40px;
          height: 42px;
        }

        .filter-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 3px;
        }

        .filter-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-tab-btn:hover {
          color: var(--text-primary);
        }

        .filter-tab-btn.active {
          background: rgba(242, 153, 74, 0.12);
          color: var(--accent-amber);
        }

        /* Grid Cards */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }

        .gallery-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .card-image-box {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
          background: #000;
        }

        .card-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .gallery-card:hover .card-photo {
          transform: scale(1.05);
        }

        .card-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(2px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gallery-card:hover .card-hover-overlay {
          opacity: 1;
        }

        .btn-icon-only {
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-frame-shortcut {
          padding: 8px 16px;
          font-size: 0.8rem;
          border-radius: var(--border-radius-sm);
        }

        .card-date-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-delete-badge-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(220, 38, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 6px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 5;
        }
        .card-delete-badge-btn:hover {
          background: rgb(220, 38, 38);
          transform: scale(1.1);
        }

        /* Card Content */
        .card-content-box {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .card-theme-title {
          font-size: 0.85rem;
          color: var(--accent-amber);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .card-author-row {
          margin-bottom: 12px;
        }

        .author-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
        }

        .instagram-link {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
          gap: 3px;
          margin-top: 2px;
          transition: color 0.2s ease;
        }

        .instagram-link:hover {
          color: var(--accent-amber);
        }

        .card-caption {
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.5;
          margin-bottom: 20px;
          flex-grow: 1;
        }

        .card-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border-glass);
          padding-top: 16px;
        }

        .social-counters {
          display: flex;
          gap: 12px;
        }

        .counter-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .counter-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .icon-heart {
          color: rgba(235, 87, 87, 0.5);
          transition: transform 0.2s ease;
        }

        .counter-btn:hover .icon-heart {
          color: #eb5757;
          transform: scale(1.15);
        }

        .icon-spark {
          color: rgba(242, 201, 76, 0.5);
          transition: transform 0.2s ease;
        }

        .counter-btn:hover .icon-spark {
          color: #f2c94c;
          transform: scale(1.15);
        }

        .read-more-indicator {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .gallery-card:hover .read-more-indicator {
          color: var(--accent-amber);
        }

        .no-results {
          padding: 60px;
          text-align: center;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .gallery-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .filter-controls {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .search-bar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
