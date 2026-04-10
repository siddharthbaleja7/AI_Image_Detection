import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await axios.post(
        "http://127.0.0.1:8000/predict",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh",
      overflow: "hidden",   // 🔥 fixes scrolling
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      color: "white",
      fontFamily: "'Poppins', sans-serif"
    }}>

      {/* Title */}
      <h1 style={{
        fontSize: "36px",
        marginBottom: "20px",
        fontWeight: "700",
        letterSpacing: "1px"
      }}>
        🧠 AI Image Authenticity Detector
      </h1>

      <p style={{
        marginBottom: "25px",
        color: "#94a3b8"
      }}>
        Detect whether an image is real or AI-generated
      </p>

      {/* Card */}
      <div style={{
        background: "#1e293b",
        padding: "40px",
        borderRadius: "20px",
        width: "450px",   // 🔥 bigger box
        minHeight: "420px",     // 🔥 fixed layout
        maxHeight: "520px",     // 🔥 prevents expansion
        overflow: "hidden",
        textAlign: "center",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
      }}>

        {/* Upload */}
        <input
          type="file"
          style={{
            marginBottom: "20px",
            fontSize: "16px"
          }}
          onChange={(e) => {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
          }}
        />

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: "100%",
              height: "250px",         // 🔥 FIXED HEIGHT
              objectFit: "cover",      // 🔥 prevents stretching
              borderRadius: "12px",
              marginBottom: "20px"
            }}
          />
        )}

        {/* Button */}
        <button
          onClick={handleUpload}
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
            width: "100%",
            fontSize: "16px",
            fontWeight: "600"
          }}
        >
          Upload & Detect
        </button>

        {/* Loading */}
        {loading && (
          <p style={{ marginTop: "20px" }}>
            🔄 Analyzing Image...
          </p>
        )}

        {/* Result */}
        {result && (
          <div style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "12px",
            background: result.prediction.includes("AI")
              ? "#7f1d1d"
              : "#14532d"
          }}>
            <h3>{result.prediction}</h3>
            <p>Confidence: {result.confidence}</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;