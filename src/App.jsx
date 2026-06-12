import React, { useState, useEffect, useRef } from "react";
import logoImg from "./assets/logo.jpg";
import { HISTORICO_GANADORES } from "./utils/historicoData";
import { 
  Download, Frame, Crop, Sliders, RefreshCw, ZoomIn, ZoomOut, 
  Upload, Sparkles, Award, Link2, Calendar, Trash2, Globe
} from "lucide-react";
import Gallery from "./components/Gallery";

export default function App() {
  // Enmarcador State
  const [theme, setTheme] = useState("Luces de La Ciudad");
  const [winnerName, setWinnerName] = useState("city_wildlens");
  const [winnerInstagram, setWinnerInstagram] = useState("city_wildlens");
  const [date, setDate] = useState("2026-06-12");
  const [location, setLocation] = useState("Torre Colpatria-Bogota");
  const [device, setDevice] = useState("Redmi Note 11s");
  const [photoUrl, setPhotoUrl] = useState("/zoomcreativo/portafolio/1.jpeg");
  
  // Customization State
  const [styleType, setStyleType] = useState("cine"); // 'cine', 'minimal', 'polaroid'
  const [format, setFormat] = useState("1:1"); // '1:1', '9:16'
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // Loading and Portfolio States
  const [winners, setWinners] = useState([]);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Canvas Refs
  const canvasRef = useRef(null);
  const mainImageRef = useRef(null);
  const logoImageRef = useRef(null);

  // Load local winners on mount
  useEffect(() => {
    const localWinners = JSON.parse(localStorage.getItem("zc_local_winners") || "[]");
    setWinners([...localWinners, ...HISTORICO_GANADORES]);
  }, []);

  // Load Main Photo & Logo
  useEffect(() => {
    setPhotoLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      mainImageRef.current = img;
      setPhotoLoaded(true);
    };
    img.onerror = () => {
      img.src = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800";
    };
    img.src = photoUrl;
  }, [photoUrl]);

  useEffect(() => {
    const logo = new Image();
    logo.onload = () => {
      logoImageRef.current = logo;
      setLogoLoaded(true);
    };
    logo.src = logoImg;
  }, []);

  // Redraw Canvas on changes
  useEffect(() => {
    if (photoLoaded && logoLoaded) {
      drawCanvas();
    }
  }, [photoLoaded, logoLoaded, styleType, format, zoom, posX, posY, theme, winnerName, winnerInstagram, date, location, device]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clean leading @ if any in instagram handle
    const cleanInstagram = winnerInstagram ? winnerInstagram.trim().replace(/^@/, "") : "";
    
    // Set high-res canvas dimensions
    const width = format === "1:1" ? 1200 : 1080;
    const height = format === "1:1" ? 1200 : 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    if (styleType === "cine") {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);
    } else if (styleType === "minimal") {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#121217");
      gradient.addColorStop(1, "#050507");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const borderGlow = ctx.createLinearGradient(0, 0, width, height);
      borderGlow.addColorStop(0, "#ff6b00");
      borderGlow.addColorStop(0.5, "#f2994a");
      borderGlow.addColorStop(1, "#f2c94c");
      ctx.strokeStyle = borderGlow;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
    } else { // polaroid
      ctx.fillStyle = "#1e1e24";
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Main Photo (Aspect-Ratio Safe Fitting)
    const img = mainImageRef.current;
    if (!img) return;

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

    // Bounding Box Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

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

    const finalW = renderW * zoom;
    const finalH = renderH * zoom;
    const finalX = boxX + (boxWidth - finalW) / 2 + posX;
    const finalY = boxY + (boxHeight - finalH) / 2 + posY;

    // Draw image inside bounding box with clipping
    ctx.save();
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxWidth, boxHeight);
    ctx.clip();
    ctx.drawImage(img, finalX, finalY, finalW, finalH);
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

    // 3. Draw Branding & Text Info
    const logo = logoImageRef.current;
    
    if (styleType === "cine") {
      if (logo) {
        ctx.save();
        const logoSize = format === "1:1" ? 50 : 60;
        const logoX = boxX;
        const logoY = boxY - logoSize - 15;
        
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        ctx.restore();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${format === "1:1" ? "20px" : "24px"} sans-serif`;
        ctx.fillText("ZOOM CREATIVO", logoX + logoSize + 15, logoY + logoSize/2 + 6);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `${format === "1:1" ? "14px" : "18px"} monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`FECHA: ${date}`, boxX + boxWidth, boxY - 25);
      ctx.textAlign = "left";

      const footerY = boxY + boxHeight + 40;
      ctx.fillStyle = "#f2994a"; // Amber
      ctx.font = `bold ${format === "1:1" ? "24px" : "28px"} sans-serif`;
      ctx.fillText(`RETO DIARIO: "${theme.toUpperCase()}"`, boxX, footerY);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `${format === "1:1" ? "14px" : "16px"} monospace`;
      ctx.fillText("FOTOGRAFÍA GANADORA", boxX, footerY + 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "32px" : "38px"} sans-serif`;
      ctx.fillText(winnerName, boxX, footerY + 70);

      if (cleanInstagram) {
        ctx.fillStyle = "#f2c94c";
        ctx.font = `500 ${format === "1:1" ? "16px" : "20px"} sans-serif`;
        ctx.fillText(`@${cleanInstagram}`, boxX, footerY + 105);
      }

      // Metadata Tech Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      const boxW = format === "1:1" ? 280 : 350;
      const boxH = format === "1:1" ? 110 : 130;
      const bx = boxX + boxWidth - boxW;
      const by = footerY;
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = `bold ${format === "1:1" ? "12px" : "14px"} monospace`;
      ctx.fillText("DETALLES DE CAPTURA:", bx + 15, by + 25);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `${format === "1:1" ? "11px" : "13px"} monospace`;
      ctx.fillText(`LUGAR: ${location.toUpperCase()}`, bx + 15, by + 50);
      ctx.fillText(`EQUIPO: ${device.toUpperCase()}`, bx + 15, by + 75);
      ctx.fillText(`FECHA: ${date}`, bx + 15, by + 100);

    } else if (styleType === "minimal") {
      const footerY = boxY + boxHeight + 45;
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
          ctx.font = "bold 20px sans-serif";
          ctx.fillText("Zoom Creativo", lx + logoSize + 15, ly + logoSize/2 - 5);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "12px monospace";
          ctx.fillText("COMUNIDAD DE FOTOGRAFÍA MÓVIL", lx + logoSize + 15, ly + logoSize/2 + 15);
        }
      }

      ctx.textAlign = format === "1:1" ? "right" : "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "38px" : "44px"} sans-serif`;
      ctx.fillText(winnerName, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 15);

      ctx.fillStyle = "#f2994a";
      ctx.font = `bold ${format === "1:1" ? "16px" : "18px"} monospace`;
      ctx.fillText(`GANADOR DEL RETO: "${theme.toUpperCase()}"`, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 45);

      if (cleanInstagram) {
        ctx.fillStyle = "#f2c94c";
        ctx.font = `${format === "1:1" ? "15px" : "16px"} sans-serif`;
        ctx.fillText(`@${cleanInstagram}`, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 75);
      }
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `${format === "1:1" ? "12px" : "14px"} monospace`;
      ctx.fillText(`${location.toUpperCase()} • ${device.toUpperCase()}`, format === "1:1" ? boxX + boxWidth : width / 2, footerY + 105);
      
      ctx.textAlign = "left";

    } else { // polaroid
      const footerY = boxY + boxHeight + 40;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${format === "1:1" ? "30px" : "36px"} serif`;
      ctx.fillText(theme, boxX, footerY + 20);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = `italic ${format === "1:1" ? "20px" : "24px"} serif`;
      ctx.fillText(`por ${winnerName}`, boxX, footerY + 55);

      if (cleanInstagram) {
        ctx.fillStyle = "#f2994a";
        ctx.font = `14px monospace`;
        ctx.fillText(`instagram: @${cleanInstagram}`, boxX, footerY + 85);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = `italic ${format === "1:1" ? "14px" : "16px"} serif`;
      ctx.fillText(`Lugar: ${location} | Cel: ${device}`, boxX, footerY + 115);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = `${format === "1:1" ? "16px" : "18px"} serif`;
      ctx.fillText(date, boxX + boxWidth, footerY + 20);
      ctx.textAlign = "left";
    }
  };

  const handlePhotoUploadChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPhotoUrl(objectUrl);
      // Reset zoom/offset
      setZoom(1);
      setPosX(0);
      setPosY(0);
    }
  };

  const saveWinnerToLocalPortfolio = () => {
    const img = mainImageRef.current;
    if (!img) return;

    // Create a temporary canvas to resize the image
    const tempCanvas = document.createElement("canvas");
    const maxDim = 600;
    let w = img.width;
    let h = img.height;
    
    if (w > h) {
      if (w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      }
    } else {
      if (h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(img, 0, 0, w, h);
    
    // Get compressed lightweight base64
    const compressedBase64 = tempCanvas.toDataURL("image/jpeg", 0.7);
    
    const newWinner = {
      id: "local_" + Date.now(),
      date: date,
      theme: theme,
      winnerName: winnerName || "Zoom Creativo",
      winnerInstagram: winnerInstagram,
      location: location,
      device: device,
      photoUrl: compressedBase64,
      description: `Ganador del reto. Capturado en ${location} con ${device}.`,
      techniques: [],
      likes: 0,
      applause: 0
    };

    try {
      const localWinners = JSON.parse(localStorage.getItem("zc_local_winners") || "[]");
      // Check if this theme + name + date combination already exists
      const exists = localWinners.some(w => w.theme === theme && w.winnerName === winnerName && w.date === date);
      if (!exists) {
        const updated = [newWinner, ...localWinners];
        localStorage.setItem("zc_local_winners", JSON.stringify(updated));
        setWinners([...updated, ...HISTORICO_GANADORES]);
      }
    } catch (e) {
      console.error("No se pudo guardar en el portafolio local (límite de almacenamiento excedido):", e);
    }
  };

  const handleDeleteLocalWinner = (id) => {
    try {
      const localWinners = JSON.parse(localStorage.getItem("zc_local_winners") || "[]");
      const updated = localWinners.filter(w => w.id !== id);
      localStorage.setItem("zc_local_winners", JSON.stringify(updated));
      setWinners([...updated, ...HISTORICO_GANADORES]);
    } catch (e) {
      console.error("Error al eliminar el ganador local:", e);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Save it to the local portfolio list
      saveWinnerToLocalPortfolio();

      const link = document.createElement("a");
      const safeTheme = theme.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const safeName = winnerName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      
      link.download = `zoom_creativo_${safeTheme}_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setDownloading(false);
    }, 600);
  };

  const handleSelectWinnerFromGallery = (winner) => {
    setTheme(winner.theme);
    setWinnerName(winner.winnerName);
    setWinnerInstagram(winner.winnerInstagram);
    setDate(winner.date);
    setPhotoUrl(winner.photoUrl);
    setLocation(winner.location || "Manizales");
    setDevice(winner.device || "Xiaomi 17");
    setZoom(1);
    setPosX(0);
    setPosY(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-root">
      
      {/* Header bar */}
      <header className="main-header-bar">
        <div className="container header-bar-container">
          <div className="brand-logo-area">
            <img src={logoImg} alt="Zoom Creativo Logo" className="main-brand-logo" />
            <div className="brand-text-box">
              <h1>ZOOM CREATIVO</h1>
              <span>FOTOGRAFÍA MÓVIL • ENMARCADOR OFICIAL</span>
            </div>
          </div>
          <div className="header-badge-tag">
            <Sparkles size={14} className="spinning-icon" />
            <span>Herramienta Administrativa</span>
          </div>
        </div>
      </header>

      {/* Main Dual-pane Section */}
      <section className="main-editor-section">
        <div className="container editor-grid">
          
          {/* Left Panel: Form Controls */}
          <div className="editor-controls-panel glass-panel animate-fade-in">
            <h2 className="panel-title-text">
              <Sliders size={18} /> Datos del Enmarcado
            </h2>

            <form onSubmit={(e) => e.preventDefault()} className="controls-form">
              
              <div className="form-group">
                <label className="form-label">Tema del Reto Diario</label>
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="ej. Sombras y Luces"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Nombre del Ganador</label>
                  <input 
                    type="text" 
                    value={winnerName}
                    onChange={(e) => setWinnerName(e.target.value)}
                    placeholder="ej. Carlos Mendoza"
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instagram (sin @)</label>
                  <input 
                    type="text" 
                    value={winnerInstagram}
                    onChange={(e) => setWinnerInstagram(e.target.value)}
                    placeholder="ej. carlos_ph"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Lugar de Captura</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ej. Manizales"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Celular / Cámara</label>
                  <input 
                    type="text" 
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    placeholder="ej. Xiaomi 17"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha del Reto</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              {/* Upload image box */}
              <div className="form-group">
                <label className="form-label">Fotografia Ganadora</label>
                <div className="upload-box-wrapper">
                  <label className="upload-label-btn">
                    <Upload size={18} />
                    <span>Seleccionar fotografia de tu galeria</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUploadChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              {/* Styles */}
              <div className="form-group">
                <label className="form-label">Estilo de Enmarcado</label>
                <div className="selector-options-row">
                  <button 
                    type="button" 
                    className={`selector-btn ${styleType === "cine" ? "active" : ""}`}
                    onClick={() => setStyleType("cine")}
                  >
                    Cine Premium
                  </button>
                  <button 
                    type="button" 
                    className={`selector-btn ${styleType === "minimal" ? "active" : ""}`}
                    onClick={() => setStyleType("minimal")}
                  >
                    Ambar Minimal
                  </button>
                  <button 
                    type="button" 
                    className={`selector-btn ${styleType === "polaroid" ? "active" : ""}`}
                    onClick={() => setStyleType("polaroid")}
                  >
                    Polaroid Retro
                  </button>
                </div>
              </div>

              {/* Format */}
              <div className="form-group">
                <label className="form-label">Formato de Salida</label>
                <div className="selector-options-row">
                  <button 
                    type="button" 
                    className={`selector-btn ${format === "1:1" ? "active" : ""}`}
                    onClick={() => setFormat("1:1")}
                  >
                    1:1 (WhatsApp/Feed)
                  </button>
                  <button 
                    type="button" 
                    className={`selector-btn ${format === "9:16" ? "active" : ""}`}
                    onClick={() => setFormat("9:16")}
                  >
                    9:16 (Instagram Stories)
                  </button>
                </div>
              </div>

              {/* Alignment details */}
              <div className="form-group">
                <div className="sliders-section-header">
                  <label className="form-label">Ajuste de Encuadre</label>
                  <button 
                    type="button" 
                    className="btn-reset-adjusts"
                    onClick={() => { setZoom(1); setPosX(0); setPosY(0); }}
                  >
                    Restablecer
                  </button>
                </div>
                
                <div className="editor-sliders-container">
                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>Zoom:</span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="2.0" 
                      step="0.02" 
                      value={zoom} 
                      onChange={(e) => setZoom(parseFloat(e.target.value))} 
                      className="slider-input"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>Mover Horizontal (X):</span>
                      <span>{posX}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-300" 
                      max="300" 
                      step="2" 
                      value={posX} 
                      onChange={(e) => setPosX(parseInt(e.target.value))} 
                      className="slider-input"
                    />
                  </div>

                  <div className="slider-item">
                    <div className="slider-label-row">
                      <span>Mover Vertical (Y):</span>
                      <span>{posY}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="-300" 
                      max="300" 
                      step="2" 
                      value={posY} 
                      onChange={(e) => setPosY(parseInt(e.target.value))} 
                      className="slider-input"
                    />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Right Panel: Canvas Preview */}
          <div className="editor-preview-panel glass-panel animate-fade-in">
            <h2 className="panel-title-text">
              <Frame size={18} /> Vista Previa HD
            </h2>

            <div className="canvas-frame-container">
              {(!photoLoaded || !logoLoaded) && (
                <div className="canvas-spinner-box">
                  <RefreshCw className="spinning-icon" size={36} />
                  <span>Procesando fotografia...</span>
                </div>
              )}
              <canvas ref={canvasRef} className="live-preview-canvas" />
            </div>

            <button 
              type="button" 
              className="btn btn-primary btn-download-hd"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <RefreshCw className="spinning-icon" size={18} />
                  Generando descarga...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Descargar Foto Enmarcada
                </>
              )}
            </button>
            
            <p className="resolution-helper-text">
              * Resolucion de salida: {format === "1:1" ? "1200 x 1200 px" : "1080 x 1920 px"} (Formato PNG de alta fidelidad).
            </p>
          </div>

        </div>
      </section>

      {/* Historical Static Gallery below */}
      <section className="portfolio-showcase-section">
        <div className="teaser-gallery-header container">
          <div className="section-title-box">
            <span className="badge badge-amber">
              <Award size={12} /> Catalogo de Ejemplos
            </span>
            <h2 className="section-title">Portafolio Historico de Zoom</h2>
            <p className="section-subtitle">Haz clic en cualquier ganador para cargar sus datos en el enmarcador de arriba de forma automatica.</p>
          </div>
        </div>
        
        <Gallery 
          winners={winners} 
          onOpenWinnerDetail={handleSelectWinnerFromGallery}
          onOpenFrameGenerator={handleSelectWinnerFromGallery}
          onDeleteLocalWinner={handleDeleteLocalWinner}
        />
      </section>

      <footer className="simplified-footer">
        <div className="container">
          <p>© 2026 Zoom Creativo. Herramienta Oficial de Enmarcado de Fotografia Movil.</p>
        </div>
      </footer>

      <style>{`
        .main-header-bar {
          height: var(--nav-height);
          background: rgba(8, 8, 10, 0.9);
          border-bottom: 1px solid var(--border-glass);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .header-bar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }

        .brand-logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .main-brand-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid var(--accent-amber);
          object-fit: cover;
        }

        .brand-text-box h1 {
          font-size: 1.2rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.05em;
        }

        .brand-text-box span {
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-weight: 600;
          letter-spacing: 0.1em;
        }

        .header-badge-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(242, 153, 74, 0.1);
          border: 1px solid rgba(242, 153, 74, 0.2);
          color: var(--accent-amber);
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .spinning-icon {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Dual-pane Editor */
        .main-editor-section {
          padding: 40px 0;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .editor-controls-panel, .editor-preview-panel {
          padding: 30px;
          display: flex;
          flex-direction: column;
        }

        .panel-title-text {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-glass);
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .controls-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .upload-box-wrapper {
          width: 100%;
        }

        .upload-label-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed var(--border-glass);
          border-radius: var(--border-radius-sm);
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-label-btn:hover {
          background: rgba(242, 153, 74, 0.03);
          border-color: var(--accent-amber);
          color: var(--text-primary);
        }

        .selector-options-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px;
        }

        .selector-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass);
          color: var(--text-secondary);
          padding: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selector-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .selector-btn.active {
          background: rgba(242, 153, 74, 0.12);
          border-color: var(--accent-amber);
          color: var(--accent-amber);
        }

        /* Adjustment Sliders */
        .sliders-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .btn-reset-adjusts {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-reset-adjusts:hover {
          color: var(--accent-amber);
        }

        .editor-sliders-container {
          background: rgba(255,255,255,0.01);
          border: 1px solid var(--border-glass);
          border-radius: var(--border-radius-sm);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .slider-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Preview area */
        .canvas-frame-container {
          background: #020202;
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-glass);
          min-height: 400px;
          height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          padding: 20px;
          margin-bottom: 24px;
        }

        .canvas-spinner-box {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-secondary);
        }

        .live-preview-canvas {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border-radius: 4px;
        }

        .btn-download-hd {
          width: 100%;
          padding: 16px;
          font-size: 1.05rem;
          border-radius: var(--border-radius-sm);
          font-weight: 700;
        }

        .resolution-helper-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 10px;
        }

        /* Portfolio */
        .portfolio-showcase-section {
          padding: 60px 0;
          border-top: 1px solid var(--border-glass);
          background: rgba(4, 4, 6, 0.2);
        }

        .teaser-gallery-header {
          margin-bottom: 30px;
        }

        .simplified-footer {
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-glass);
          padding: 24px 0;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        @media (max-width: 992px) {
          .editor-grid {
            grid-template-columns: 1fr;
          }
          .canvas-frame-container {
            height: 420px;
          }
        }
      `}</style>
    </div>
  );
}
