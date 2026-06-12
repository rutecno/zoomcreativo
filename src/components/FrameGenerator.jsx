import React, { useState, useEffect, useRef } from "react";
import { Download, Frame, Crop, Sliders, ChevronLeft, RefreshCw, ZoomIn, ZoomOut, Check } from "lucide-react";
import logoImg from "../assets/logo.jpg";

export default function FrameGenerator({ winnerData, onClose }) {
  const canvasRef = useRef(null);
  const [styleType, setStyleType] = useState("cine"); // 'cine', 'minimal', 'polaroid'
  const [format, setFormat] = useState("1:1"); // '1:1', '9:16'
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const mainImageRef = useRef(null);
  const logoImageRef = useRef(null);

  // Initialize and load images
  useEffect(() => {
    setPhotoLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      mainImageRef.current = img;
      setPhotoLoaded(true);
    };
    img.onerror = () => {
      // Fallback to stock unsplash image if local URL fails (e.g., mock paths)
      img.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800";
    };
    img.src = winnerData.photoUrl;

    const logo = new Image();
    logo.onload = () => {
      logoImageRef.current = logo;
      setLogoLoaded(true);
    };
    logo.src = logoImg;
  }, [winnerData]);

  // Redraw Canvas on changes
  useEffect(() => {
    if (!photoLoaded || !logoLoaded) return;
    drawCanvas();
  }, [photoLoaded, logoLoaded, styleType, format, zoom, posX, posY]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Set high-res canvas dimensions
    const width = format === "1:1" ? 1200 : 1080;
    const height = format === "1:1" ? 1200 : 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    if (styleType === "cine") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);
      // Film grain / texture simulation or simple border lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);
    } else if (styleType === "minimal") {
      // Dark gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#121217");
      gradient.addColorStop(1, "#050507");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Glowing outer border
      const borderGlow = ctx.createLinearGradient(0, 0, width, height);
      borderGlow.addColorStop(0, "#ff6b00");
      borderGlow.addColorStop(0.5, "#f2994a");
      borderGlow.addColorStop(1, "#f2c94c");
      ctx.strokeStyle = borderGlow;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
    } else { // polaroid
      // Cozy retro paper theme (soft dark/cream)
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Main Photo (Aspect-Ratio Safe Fitting)
    const img = mainImageRef.current;
    if (!img) return;

    // Define the bounding box for the image area inside the frame
    // We leave space for headers and footers
    let boxWidth, boxHeight, boxX, boxY;

    if (format === "1:1") {
      boxWidth = width * 0.84;
      boxHeight = height * 0.72;
      boxX = (width - boxWidth) / 2;
      boxY = height * 0.08;
    } else { // 9:16
      boxWidth = width * 0.88;
      boxHeight = height * 0.65;
      boxX = (width - boxWidth) / 2;
      boxY = height * 0.12;
    }

    // Draw bounding box background
    ctx.fillStyle = "#000000";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Calculate aspect ratio fit (Never crop, fit fully inside)
    const imgRatio = img.width / img.height;
    const boxRatio = boxWidth / boxHeight;

    let renderW, renderH;
    if (imgRatio > boxRatio) {
      renderW = boxWidth;
      renderH = boxWidth / imgRatio;
    } else {
      renderH = boxHeight;
      renderW = boxHeight * imgRatio;
    }

    // Apply Zoom & Position Adjustments
    const finalW = renderW * zoom;
    const finalH = renderH * zoom;
    const finalX = boxX + (boxWidth - finalW) / 2 + posX;
    const finalY = boxY + (boxHeight - finalH) / 2 + posY;

    // Draw the image inside the bounding box using clipping path
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.clip();
    
    // Draw image
    ctx.drawImage(img, finalX, finalY, finalW, finalH);
    ctx.restore();

    // Draw a subtle border around the image box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 3. Draw Branding & Text Info
    const logo = logoImageRef.current;
    
    if (styleType === "cine") {
      // Header branding
      if (logo) {
        // Draw round logo
        ctx.save();
        const logoSize = format === "1:1" ? 50 : 60;
        const logoX = boxX;
        const logoY = boxY - logoSize - 15;
        
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        // Logo name
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${format === "1:1" ? "20px" : "24px"} var(--font-sans), system-ui`;
        ctx.fillText("ZOOM CREATIVO", logoX + logoSize + 15, logoY + logoSize/2 + 6);
      }

      // Top Right info
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `${format === "1:1" ? "14px" : "18px"} monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`FECHA: ${winnerData.date}`, boxX + boxWidth, boxY - 25);
      ctx.textAlign = "left"; // reset

      // Bottom footer info
      const footerY = boxY + boxHeight + 40;
      
      // Theme
      ctx.fillStyle = "#f2994a"; // Amber
      ctx.font = `bold ${format === "1:1" ? "24px" : "28px"} var(--font-sans), system-ui`;
      ctx.fillText(`RETO DIARIO: "${winnerData.theme.toUpperCase()}"`, boxX, footerY);

      // Winner label
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `${format === "1:1" ? "14px" : "16px"} monospace`;
      ctx.fillText("FOTOGRAFÍA GANADORA", boxX, footerY + 30);

      // Photographer name & instagram
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "32px" : "38px"} var(--font-sans), system-ui`;
      ctx.fillText(winnerData.winnerName, boxX, footerY + 70);

      if (winnerData.winnerInstagram) {
        ctx.fillStyle = "#f2c94c";
        ctx.font = `500 ${format === "1:1" ? "16px" : "20px"} var(--font-sans), system-ui`;
        ctx.fillText(`@${winnerData.winnerInstagram}`, boxX, footerY + 105);
      }

      // Technical details box on bottom right
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      const boxW = format === "1:1" ? 280 : 350;
      const boxH = format === "1:1" ? 110 : 130;
      const bx = boxX + boxWidth - boxW;
      const by = footerY;
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = `bold ${format === "1:1" ? "12px" : "14px"} monospace`;
      ctx.fillText("TÉCNICAS APLICADAS:", bx + 15, by + 25);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `${format === "1:1" ? "11px" : "13px"} monospace`;
      const techs = winnerData.techniques && winnerData.techniques.length > 0 
        ? winnerData.techniques 
        : ["Enfoque selectivo", "Manejo de luz natural"];
      
      techs.slice(0, 3).forEach((tech, i) => {
        ctx.fillText(`• ${tech}`, bx + 15, by + 50 + (i * 20));
      });

    } else if (styleType === "minimal") {
      // Glow/Minimal style
      const footerY = boxY + boxHeight + 45;

      // Draw Logo centered on bottom in vertical format, or on bottom left in square
      if (logo) {
        const logoSize = 70;
        const lx = format === "1:1" ? boxX : (width - logoSize) / 2;
        const ly = format === "1:1" ? footerY + 10 : height - 130;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx + logoSize/2, ly + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, lx, ly, logoSize, logoSize);
        ctx.restore();

        if (format === "1:1") {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 20px var(--font-sans)";
          ctx.fillText("Zoom Creativo", lx + logoSize + 15, ly + logoSize/2 - 5);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "12px monospace";
          ctx.fillText("COMUNIDAD DE FOTOGRAFÍA MÓVIL", lx + logoSize + 15, ly + logoSize/2 + 15);
        }
      }

      // Write Photographer Title (Big, Elegant)
      ctx.textAlign = format === "1:1" ? "right" : "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "38px" : "44px"} var(--font-sans)`;
      ctx.fillText(winnerData.winnerName, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 15);

      ctx.fillStyle = "#f2994a"; // Amber gradient color
      ctx.font = `bold ${format === "1:1" ? "16px" : "18px"} monospace`;
      ctx.fillText(`GANADOR DEL RETO: "${winnerData.theme.toUpperCase()}"`, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 45);

      if (winnerData.winnerInstagram) {
        ctx.fillStyle = "#f2c94c";
        ctx.font = `${format === "1:1" ? "15px" : "16px"} var(--font-sans)`;
        ctx.fillText(`@${winnerData.winnerInstagram}`, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 75);
      }

      ctx.textAlign = "left"; // reset

    } else { // polaroid
      // Polaroid style: Large white border bottom, handwritten text
      const footerY = boxY + boxHeight + 40;

      // Draw handwritten challenge theme & photographer name
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "30px" : "36px"} var(--font-serif)`;
      ctx.fillText(winnerData.theme, boxX, footerY + 20);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = `italic ${format === "1:1" ? "20px" : "24px"} var(--font-serif)`;
      ctx.fillText(`por ${winnerData.winnerName}`, boxX, footerY + 55);

      if (winnerData.winnerInstagram) {
        ctx.fillStyle = "#f2994a";
        ctx.font = `14px monospace`;
        ctx.fillText(`instagram: @${winnerData.winnerInstagram}`, boxX, footerY + 85);
      }

      // Draw date on right bottom
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `${format === "1:1" ? "16px" : "18px"} var(--font-serif)`;
      ctx.fillText(winnerData.date, boxX + boxWidth, footerY + 20);
      ctx.textAlign = "left";
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const link = document.createElement("a");
      const safeTheme = winnerData.theme.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const safeName = winnerData.winnerName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      
      link.download = `zoom_creativo_${safeTheme}_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setDownloading(false);
    }, 600);
  };

  const resetAdjustments = () => {
    setZoom(1);
    setPosX(0);
    setPosY(0);
  };

  return (
    <div className="frame-generator-overlay">
      <div className="frame-generator-container glass-panel animate-fade-in">
        
        {/* Header */}
        <div className="frame-header">
          <button className="back-btn" onClick={onClose}>
            <ChevronLeft size={20} />
            <span>Volver</span>
          </button>
          <h3>Generador de Enmarcado Oficial</h3>
          <div style={{ width: 60 }}></div> {/* spacer */}
        </div>

        <div className="frame-body">
          {/* Left: Canvas Preview */}
          <div className="preview-area">
            {(!photoLoaded || !logoLoaded) && (
              <div className="canvas-loading-spinner">
                <RefreshCw size={36} className="spinning-icon" />
                <p>Cargando fotografía y elementos de diseño...</p>
              </div>
            )}
            <canvas ref={canvasRef} className="frame-canvas-preview" />
          </div>

          {/* Right: Controls Panel */}
          <div className="controls-area">
            <div className="control-section">
              <span className="control-title">
                <Frame size={16} /> Estilo de Marco
              </span>
              <div className="style-options-grid">
                <button
                  className={`style-option-btn ${styleType === "cine" ? "active" : ""}`}
                  onClick={() => setStyleType("cine")}
                >
                  <span className="option-name">Cine Premium</span>
                  <span className="option-desc">Fondo oscuro, info técnica y logo</span>
                </button>
                <button
                  className={`style-option-btn ${styleType === "minimal" ? "active" : ""}`}
                  onClick={() => setStyleType("minimal")}
                >
                  <span className="option-name">Ámbar Minimal</span>
                  <span className="option-desc">Borde con degradado brillante y centrado</span>
                </button>
                <button
                  className={`style-option-btn ${styleType === "polaroid" ? "active" : ""}`}
                  onClick={() => setStyleType("polaroid")}
                >
                  <span className="option-name">Polaroid Dark</span>
                  <span className="option-desc">Diseño retro con tipografía serif</span>
                </button>
              </div>
            </div>

            <div className="control-section">
              <span className="control-title">
                <Crop size={16} /> Formato / Red Social
              </span>
              <div className="format-options">
                <button
                  className={`format-btn ${format === "1:1" ? "active" : ""}`}
                  onClick={() => setFormat("1:1")}
                >
                  <span>1:1 Cuadrado</span>
                  <span className="format-desc">Ideal para Feed / WhatsApp</span>
                </button>
                <button
                  className={`format-btn ${format === "9:16" ? "active" : ""}`}
                  onClick={() => setFormat("9:16")}
                >
                  <span>9:16 Vertical</span>
                  <span className="format-desc">Ideal para Instagram Stories</span>
                </button>
              </div>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <span className="control-title">
                  <Sliders size={16} /> Ajustes de Imagen
                </span>
                <button className="reset-btn" onClick={resetAdjustments}>
                  <RefreshCw size={12} /> Reiniciar
                </button>
              </div>
              
              <div className="adjustments-box">
                <div className="slider-group">
                  <div className="slider-labels">
                    <span>Zoom ({Math.round(zoom * 100)}%)</span>
                    <div className="zoom-quick-buttons">
                      <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}><ZoomOut size={12} /></button>
                      <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn size={12} /></button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="slider-input"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-labels">
                    <span>Posición Horizontal (X: {posX}px)</span>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    step="5"
                    value={posX}
                    onChange={(e) => setPosX(parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-labels">
                    <span>Posición Vertical (Y: {posY}px)</span>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    step="5"
                    value={posY}
                    onChange={(e) => setPosY(parseInt(e.target.value))}
                    className="slider-input"
                  />
                </div>
              </div>
            </div>

            <div className="action-section">
              <button 
                className="btn btn-primary btn-download-frame" 
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <RefreshCw size={18} className="spinning-icon" />
                    Generando Imagen HD...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Descargar Foto Enmarcada
                  </>
                )}
              </button>
              <p className="download-tip">
                * La imagen se descargará en alta definición directamente a tu carpeta de descargas sin comprometer la resolución original.
              </p>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .frame-generator-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 4, 6, 0.9);
          backdrop-filter: blur(8px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow-y: auto;
        }

        .frame-generator-container {
          width: 100%;
          max-width: 1100px;
          background: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .frame-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-glass);
        }

        .back-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .back-btn:hover {
          color: var(--text-primary);
        }

        .frame-header h3 {
          font-weight: 700;
          font-size: 1.2rem;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .frame-body {
          display: grid;
          grid-template-columns: 1fr 450px;
          align-items: stretch;
          height: calc(100vh - 180px);
          max-height: 750px;
        }

        /* Preview Area */
        .preview-area {
          background: #020202;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 30px;
          border-right: 1px solid var(--border-glass);
        }

        .canvas-loading-spinner {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-secondary);
          z-index: 10;
        }

        .spinning-icon {
          animation: spin 1.5s linear infinite;
          color: var(--accent-amber);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .frame-canvas-preview {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
          border-radius: 4px;
        }

        /* Controls Area */
        .controls-area {
          padding: 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: rgba(10, 10, 14, 0.3);
        }

        .control-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .control-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .control-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .reset-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .reset-btn:hover {
          color: var(--accent-amber);
        }

        .style-options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .style-option-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 12px 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .style-option-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--text-muted);
        }

        .style-option-btn.active {
          border-color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.08);
          box-shadow: 0 0 10px rgba(242, 153, 74, 0.05);
        }

        .option-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .style-option-btn.active .option-name {
          color: var(--accent-amber);
        }

        .option-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .format-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .format-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }

        .format-btn:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .format-btn.active {
          border-color: var(--accent-amber);
          background: rgba(242, 153, 74, 0.08);
          color: var(--accent-amber);
        }

        .format-desc {
          font-size: 0.7rem;
          font-weight: 400;
          color: var(--text-muted);
        }

        .adjustments-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .zoom-quick-buttons {
          display: flex;
          gap: 6px;
        }

        .zoom-quick-buttons button {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .zoom-quick-buttons button:hover {
          background: rgba(255,255,255,0.12);
          color: var(--text-primary);
        }

        .slider-input {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--bg-tertiary);
          outline: none;
        }

        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-amber);
          cursor: pointer;
          transition: transform 0.1s ease;
        }

        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.25);
        }

        /* Action Section */
        .action-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-download-frame {
          padding: 16px;
          font-size: 1rem;
          border-radius: var(--border-radius-sm);
          width: 100%;
          font-weight: 700;
        }

        .download-tip {
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.4;
          text-align: center;
        }

        /* Responsive Layout */
        @media (max-width: 992px) {
          .frame-body {
            grid-template-columns: 1fr;
            height: auto;
            max-height: none;
          }
          .preview-area {
            border-right: none;
            border-bottom: 1px solid var(--border-glass);
            height: 450px;
          }
        }
      `}</style>
    </div>
  );
}
