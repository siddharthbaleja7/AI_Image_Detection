import { useState, useEffect, useRef } from "react";
import axios from "axios";

// SVG Icons as custom inline elements to avoid package compilation overhead
const ShieldCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-emerald)" }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);

const ShieldAlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-rose)" }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const UploadCloudIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const TICKER_MESSAGES = [
  "Initializing image authenticity scanning...",
  "Parsing JPEG spatial metadata structure...",
  "Analyzing frequency noise distribution...",
  "Evaluating Convolutional model activations...",
  "Running PyTorch ConvNeXt inference pipeline...",
  "Computing binary classification sigmoid...",
  "Compiling authenticity verification score...",
];

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileDetails, setFileDetails] = useState({ name: "", size: "", type: "", dimensions: "Calculating..." });
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle' | 'scanning' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [scanMessage, setScanMessage] = useState(TICKER_MESSAGES[0]);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState([]);
  
  const fileInputRef = useRef(null);
  const tickerIntervalRef = useRef(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    const savedHistory = localStorage.getItem("ai_detector_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("ai_detector_history", JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Could not save to localStorage (possibly quota exceeded)", e);
    }
  };

  // Ticker animation for loading message
  useEffect(() => {
    if (status === "scanning") {
      let index = 0;
      tickerIntervalRef.current = setInterval(() => {
        index = (index + 1) % TICKER_MESSAGES.length;
        setScanMessage(TICKER_MESSAGES[index]);
      }, 750);
    } else {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
      }
    }

    return () => {
      if (tickerIntervalRef.current) {
        clearInterval(tickerIntervalRef.current);
      }
    };
  }, [status]);

  // Clean up object URLs when preview changes
  useEffect(() => {
    return () => {
      // Prevents memory leaks by releasing object URLs
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreview(objectUrl);
    setResult(null);
    setStatus("idle");
    setErrorMsg("");

    // Calculate dimensions
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setFileDetails({
        name: selectedFile.name,
        size: formatBytes(selectedFile.size),
        type: selectedFile.type.split("/")[1].toUpperCase(),
        dimensions: `${img.width} × ${img.height} px`,
        rawSize: selectedFile.size
      });
    };
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Trigger file analysis
  const runDetection = async () => {
    if (!file) return;

    setStatus("scanning");
    
    const formData = new FormData();
    formData.append("file", file);

    const startTime = Date.now();

    try {
      // Force minimum scan animation time of 1500ms to allow scanning animation to be visible
      const [apiResponse] = await Promise.all([
        axios.post("http://127.0.0.1:8000/predict", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);

      const data = apiResponse.data;
      const scanDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      const enrichedResult = {
        ...data,
        scanDuration: `${scanDuration}s`
      };

      setResult(enrichedResult);
      setStatus("success");

      // Add to session history
      const historyItem = {
        id: Date.now().toString(),
        filename: file.name,
        // Save preview url or a small thumbnail if persistent is needed. 
        // We'll store a placeholder fallback image or the object URL for active session
        preview: preview,
        prediction: data.prediction,
        confidence: data.confidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: {
          size: fileDetails.size,
          dimensions: fileDetails.dimensions,
          type: fileDetails.type,
          scanDuration: `${scanDuration}s`
        }
      };

      saveHistory([historyItem, ...history.slice(0, 19)]); // Cap history at 20 items

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Network Error: Could not connect to inference backend server.");
      setStatus("error");
    }
  };

  // Preset example click
  const loadPreset = async (url, name) => {
    try {
      setStatus("scanning");
      setResult(null);
      
      // Fetch image from preset URL
      const res = await fetch(url);
      const blob = await res.blob();
      const presetFile = new File([blob], name, { type: blob.type });
      
      handleFile(presetFile);
      // Wait for image onload state update
      setTimeout(() => {
        setFile(presetFile);
        setStatus("idle");
      }, 100);
    } catch (e) {
      console.error("Failed to load preset image", e);
      alert("Failed to load preset image. Make sure you are online.");
      setStatus("idle");
    }
  };

  // Re-load result from history log
  const loadHistoryItem = (item) => {
    setPreview(item.preview);
    setFile(null); // Clear file to indicate read-only view from history
    setResult({
      prediction: item.prediction,
      confidence: item.confidence,
      scanDuration: item.details.scanDuration
    });
    setFileDetails({
      name: item.filename,
      size: item.details.size,
      dimensions: item.details.dimensions,
      type: item.details.type
    });
    setStatus("success");
  };

  const removeHistoryItem = (e, id) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your analysis log?")) {
      saveHistory([]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg("");
    setFileDetails({ name: "", size: "", type: "", dimensions: "Calculating..." });
  };

  // Logic to determine output classifications
  const isAI = result ? result.prediction.includes("AI") : false;
  // Calculate confidence percentage
  // If AI, confidence = prob. If Real, confidence = 1 - prob.
  const rawConfidence = result ? result.confidence : 0;
  const confidenceVal = result 
    ? (isAI ? rawConfidence * 100 : (1 - rawConfidence) * 100)
    : 0;

  // Circular gauge parameters
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~402.1
  const strokeDashoffset = circumference - (confidenceVal / 100) * circumference;

  return (
    <div className="app-container">
      {/* Aurora Ambient Backgrounds */}
      <div className="aurora-container">
        <div className="aurora aurora-1"></div>
        <div className="aurora aurora-2"></div>
        <div className="aurora aurora-3"></div>
      </div>

      {/* Main Workspace Column */}
      <main className="main-workspace">
        {/* Header */}
        <header className="app-header">
          <div className="brand">
            <div className="brand-logo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: "white" }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="brand-title">AURA Authenticator</h1>
          </div>
          
          <div className="badge-engine">
            <div className="badge-dot"></div>
            <span>CONVNEXT-BASE ENGINE ACTIVE</span>
          </div>
        </header>

        {/* Content Box */}
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="glass-card" style={{ width: "100%", maxWidth: "560px", padding: "32px", position: "relative" }}>
            
            {/* Title / Description */}
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>AI Image Authenticity Detector</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                Upload an image to scan for artificial generative noise and synthetic deepfake patterns.
              </p>
            </div>

            {/* SCREEN 1: IDLE / SELECT FILE */}
            {status === "idle" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {!preview ? (
                  <>
                    <div 
                      className={`dropzone ${dragActive ? 'drag-active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleFile(e.target.files[0])}
                      />
                      <div className="dropzone-icon">
                        <UploadCloudIcon />
                      </div>
                      <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>Drag & Drop Image Here</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>Supports PNG, JPEG, WEBP files up to 10MB</p>
                      <span 
                        style={{ 
                          fontSize: "13px", 
                          color: "var(--accent-blue)", 
                          background: "rgba(59, 130, 246, 0.1)",
                          padding: "6px 16px",
                          borderRadius: "8px",
                          fontWeight: "600"
                        }}
                      >
                        Browse Files
                      </span>
                    </div>

                    {/* Presets / Demo images */}
                    <div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", textAlign: "center" }}>
                        Or run a quick test with a preset
                      </p>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: "auto", fontSize: "12px", padding: "8px 12px" }}
                          onClick={() => loadPreset("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80", "real_portrait.jpg")}
                        >
                          📷 Camera Portrait
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ width: "auto", fontSize: "12px", padding: "8px 12px" }}
                          onClick={() => loadPreset("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80", "synthetic_art.jpg")}
                        >
                          🎨 Synthetic Texture
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="preview-container">
                      <img 
                        src={preview} 
                        alt="Preview upload" 
                        style={{ width: "100%", maxHeight: "300px", objectFit: "contain", display: "block", margin: "0 auto" }}
                      />
                    </div>

                    {/* Image details tag */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileDetails.name}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{fileDetails.dimensions} • {fileDetails.size} • {fileDetails.type}</p>
                      </div>
                      <button onClick={handleReset} className="history-clear-btn" style={{ padding: "8px" }} title="Remove Image">
                        <TrashIcon />
                      </button>
                    </div>

                    <button className="btn btn-primary" onClick={runDetection}>
                      <span>Run Authenticity Scan</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 2: SCANNING / LOADING */}
            {status === "scanning" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: "24px" }}>
                <div className="preview-container" style={{ width: "100%", maxWidth: "340px" }}>
                  <div className="scanning-bar"></div>
                  <img 
                    src={preview} 
                    alt="Scanning" 
                    style={{ width: "100%", maxHeight: "220px", objectFit: "contain", opacity: 0.65, display: "block" }}
                  />
                </div>

                <div style={{ textAlign: "center" }}>
                  <div className="spinner" style={{ marginBottom: "16px" }}></div>
                  <h4 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>Running Deep Inference</h4>
                  <p style={{ color: "var(--accent-cyan)", fontSize: "13px", fontFamily: "monospace", minHeight: "18px" }}>
                    {scanMessage}
                  </p>
                </div>
              </div>
            )}

            {/* SCREEN 3: SUCCESS / RESULTS */}
            {status === "success" && result && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Result header banner */}
                <div 
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    borderRadius: "14px",
                    border: `1px solid ${isAI ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    background: isAI ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    boxShadow: isAI ? '0 0 15px rgba(244, 63, 94, 0.05)' : '0 0 15px rgba(16, 185, 129, 0.05)',
                  }}
                >
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    {isAI ? <ShieldAlertIcon /> : <ShieldCheckIcon />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: isAI ? 'var(--accent-rose)' : 'var(--accent-emerald)', textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {result.prediction}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {isAI 
                        ? "This image contains signatures indicating synthetic generation or neural manipulation." 
                        : "No neural network artifacts detected. This image appears to be physical camera-captured content."
                      }
                    </p>
                  </div>
                </div>

                {/* Circular Gauge */}
                <div style={{ position: "relative", display: "flex", justifyContent: "center", padding: "10px 0" }}>
                  <div className="gauge-svg-container">
                    <svg width="150" height="150" viewBox="0 0 150 150">
                      {/* Glow effects for gauge stroke */}
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={isAI ? "var(--accent-rose)" : "var(--accent-emerald)"} />
                          <stop offset="100%" stopColor={isAI ? "#b91c1c" : "#047857"} />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <circle 
                        className="gauge-track" 
                        cx="75" 
                        cy="75" 
                        r={radius} 
                      />
                      <circle 
                        className="gauge-value-bar" 
                        cx="75" 
                        cy="75" 
                        r={radius} 
                        stroke="url(#gaugeGrad)"
                        filter="url(#glow)"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="gauge-label">
                      <span className="gauge-percent" style={{ color: isAI ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        {confidenceVal.toFixed(1)}%
                      </span>
                      <span className="gauge-caption">Confidence</span>
                    </div>
                  </div>
                </div>

                {/* Grid info details */}
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-item-label">Analysis Outcome</span>
                    <span className="info-item-value" style={{ color: isAI ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {isAI ? "AI / Synthetic" : "Authentic Real"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-item-label">Scan Speed</span>
                    <span className="info-item-value">{result.scanDuration || "0.45s"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-item-label">Image Resolution</span>
                    <span className="info-item-value">{fileDetails.dimensions}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-item-label">File Details</span>
                    <span className="info-item-value" title={`${fileDetails.name} (${fileDetails.size})`}>
                      {fileDetails.type} • {fileDetails.size}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn btn-primary" onClick={handleReset} style={{ flexGrow: 1 }}>
                    <RefreshIcon />
                    <span>Scan Another Image</span>
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 4: ERROR STATE */}
            {status === "error" && (
              <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ margin: "0 auto", width: "50px", height: "50px", background: "rgba(244, 63, 94, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldAlertIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--accent-rose)", marginBottom: "6px" }}>Inference Error</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5" }}>
                    {errorMsg}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
                    Back
                  </button>
                  <button className="btn btn-primary" onClick={runDetection} style={{ flex: 1 }}>
                    Retry Scan
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Sidebar Panel: Session history logs */}
      <aside className="sidebar">
        <div className="history-title">
          <span>Analysis History</span>
          {history.length > 0 && (
            <button className="history-clear-btn" onClick={clearHistory}>
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="empty-history" style={{ flexGrow: 1 }}>
            <ImagePlaceholderIcon />
            <p>No recent image scans in this session.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const itemIsAI = item.prediction.includes("AI");
              const itemConf = itemIsAI ? item.confidence * 100 : (1 - item.confidence) * 100;
              
              return (
                <div 
                  key={item.id} 
                  className={`history-item ${fileDetails.name === item.filename ? 'active' : ''}`}
                  onClick={() => loadHistoryItem(item)}
                >
                  <img 
                    src={item.preview || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                    alt="Thumbnail" 
                    className="history-thumbnail"
                  />
                  <div className="history-info">
                    <span className="history-filename">{item.filename}</span>
                    <div className="history-meta">
                      <span className={`history-badge ${itemIsAI ? 'history-badge-ai' : 'history-badge-real'}`}>
                        {itemIsAI ? 'AI' : 'REAL'}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>
                        {itemConf.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button 
                    className="history-delete-item-btn" 
                    onClick={(e) => removeHistoryItem(e, item.id)}
                    title="Delete log"
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}

export default App;