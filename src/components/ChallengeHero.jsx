import React, { useState, useEffect } from "react";
import { Clock, Calendar, Camera, ArrowRight, Award, Link2, Flame } from "lucide-react";


export default function ChallengeHero({ activeChallenge, lastWinner, onParticipate, onOpenWinnerDetail }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (!activeChallenge) return;

    const updateTimer = () => {
      const now = new Date();
      
      // Target is 7:30 PM (19:30:00) of today
      const target = new Date();
      target.setHours(19, 30, 0, 0);

      // If current time is past 7:30 PM, the challenge is closed for submissions
      if (now > target) {
        setIsClosed(true);
        setTimeLeft("Cerrado");
        return;
      }

      setIsClosed(false);
      const diffMs = target - now;
      const diffHours = Math.floor(diffMs / 3600000);
      const diffMins = Math.floor((diffMs % 3600000) / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);

      const formatNum = (num) => num.toString().padStart(2, "0");
      setTimeLeft(`${formatNum(diffHours)}:${formatNum(diffMins)}:${formatNum(diffSecs)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeChallenge]);

  return (
    <div className="challenge-hero-section animate-fade-in">
      <div className="container grid-container">
        
        {/* Left Side: Active Challenge */}
        {activeChallenge ? (
          <div className="active-challenge-card glass-panel">
            <div className="card-badge">
              <span className="badge badge-amber">
                <Flame size={12} className="pulse-icon" /> Reto de Hoy
              </span>
              <span className="challenge-date">
                <Calendar size={12} /> {activeChallenge.date}
              </span>
            </div>

            <h1 className="challenge-title">{activeChallenge.theme}</h1>
            <p className="challenge-desc">{activeChallenge.description}</p>

            <div className="challenge-meta">
              <div className="timer-box">
                <span className="timer-label">TIEMPO RESTANTE:</span>
                <div className="timer-display">
                  <Clock size={22} className="timer-clock-icon" />
                  <span className="timer-value">{timeLeft}</span>
                </div>
                <span className="timer-limit-hint">Límite de envío: 7:30 PM</span>
              </div>
            </div>

            <div className="hero-action-row">
              {isClosed ? (
                <div className="closed-banner">
                  <p>⏳ El plazo de envío ha terminado. Los administradores están evaluando las fotos de hoy.</p>
                </div>
              ) : (
                <button className="btn btn-primary btn-participate" onClick={onParticipate}>
                  <Camera size={18} />
                  Enviar mi fotografía
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="active-challenge-card glass-panel no-active-challenge">
            <Award size={48} className="no-challenge-icon" />
            <h2>No hay reto activo hoy</h2>
            <p>El administrador publicará el próximo reto fotográfico muy pronto. ¡Mantente atento!</p>
          </div>
        )}

        {/* Right Side: Yesterday's Winner Spotlight */}
        {lastWinner && (
          <div className="winner-spotlight-card glass-panel" onClick={() => onOpenWinnerDetail(lastWinner)}>
            <div className="winner-image-container">
              <img src={lastWinner.photoUrl} alt="Foto ganadora" className="winner-photo" />
              <div className="winner-overlay-gradient"></div>
              <div className="winner-award-badge">
                <Award size={18} />
                <span>GANADOR DE AYER</span>
              </div>
              <div className="winner-overlay-details">
                <span className="winner-theme">Reto: "{lastWinner.theme}"</span>
                <h3 className="winner-photographer">{lastWinner.winnerName}</h3>
                {lastWinner.winnerInstagram && (
                  <span className="winner-instagram">
                    <Link2 size={12} /> @{lastWinner.winnerInstagram}
                  </span>
                )}
              </div>
            </div>
            <div className="winner-card-body">
              <p className="winner-quote">"{lastWinner.description.slice(0, 100)}{lastWinner.description.length > 100 ? "..." : ""}"</p>
              <div className="winner-button-row">
                <span className="view-winner-link">Ver detalles y enmarcar fotografía</span>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        .challenge-hero-section {
          padding-top: calc(var(--nav-height) + 40px);
          padding-bottom: 40px;
          position: relative;
        }

        .grid-container {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 32px;
          align-items: stretch;
        }

        /* Active Challenge Style */
        .active-challenge-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(22, 22, 31, 0.7) 0%, rgba(10, 10, 14, 0.9) 100%);
          border-left: 4px solid var(--accent-amber);
        }

        .no-active-challenge {
          padding: 60px 40px;
          text-align: center;
          align-items: center;
          color: var(--text-secondary);
        }

        .no-challenge-icon {
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .card-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .challenge-date {
          font-size: 0.8rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .challenge-title {
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #ffffff 0%, #dcdfe5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .challenge-desc {
          color: var(--text-secondary);
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .challenge-meta {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-md);
          padding: 20px 24px;
          margin-bottom: 32px;
          width: fit-content;
          min-width: 280px;
        }

        .timer-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .timer-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .timer-clock-icon {
          color: var(--accent-amber);
        }

        .timer-value {
          font-size: 2rem;
          font-weight: 800;
          font-family: monospace;
          color: var(--text-primary);
          letter-spacing: 1px;
        }

        .timer-limit-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .btn-participate {
          padding: 14px 28px;
          font-size: 1rem;
          border-radius: var(--border-radius-md);
          box-shadow: 0 0 25px rgba(242, 153, 74, 0.25);
        }

        .pulse-icon {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .closed-banner {
          background: rgba(242, 153, 74, 0.1);
          border: 1px dashed rgba(242, 153, 74, 0.3);
          border-radius: var(--border-radius-sm);
          padding: 12px 20px;
          color: var(--accent-amber);
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Winner Spotlight Style */
        .winner-spotlight-card {
          cursor: pointer;
          padding: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
        }

        .winner-image-container {
          position: relative;
          width: 100%;
          height: 250px;
          overflow: hidden;
        }

        .winner-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        .winner-spotlight-card:hover .winner-photo {
          transform: scale(1.05);
        }

        .winner-overlay-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.2) 60%, transparent 100%);
        }

        .winner-award-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: var(--accent-gradient);
          color: #000000;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 6px 12px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        .winner-overlay-details {
          position: absolute;
          bottom: 16px;
          left: 20px;
          right: 20px;
        }

        .winner-theme {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent-amber);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .winner-photographer {
          font-size: 1.4rem;
          font-weight: 700;
          margin-top: 4px;
          color: var(--text-primary);
        }

        .winner-instagram {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        .winner-card-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          justify-content: space-between;
        }

        .winner-quote {
          font-style: italic;
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .view-winner-link {
          font-size: 0.85rem;
          color: var(--accent-amber);
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .winner-spotlight-card:hover .view-winner-link {
          color: var(--text-primary);
          text-decoration: underline;
        }

        @media (max-width: 992px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
          .challenge-title {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
}
