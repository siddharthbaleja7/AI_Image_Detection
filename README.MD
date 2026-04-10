# 🧠 AI Image Authenticity Detector

An end-to-end AI application that detects whether an image is **real (camera-captured)** or **AI-generated / synthetic** using deep learning.

---

## 🚀 Features

* Upload image via web interface
* Detect if image is:

  * Real 📷
  * AI Generated 🤖
  * Uncertain ⚠️ (for hard cases)
* Confidence score display
* Modern React UI
* FastAPI backend for inference
* Custom trained ConvNeXt model

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* Axios

### Backend

* FastAPI
* PyTorch
* TIMM (ConvNeXt)

### Model

* ConvNeXt Base (fine-tuned)
* Binary classification (Real vs AI)

---

## 📂 Project Structure

```
ai-image-detector/
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── inference.py
│       ├── preprocess.py
│       └── model_loader.py
│
├── frontend/
│   └── src/
│       └── App.jsx
│
├── training/
│   └── train.py
│
├── dataset/
│   ├── real/
│   └── ai/
│
├── models/
│   └── best_model.pth
```

---

## 🧠 Model Training

* Architecture: ConvNeXt Base
* Loss: Binary Cross Entropy (BCEWithLogitsLoss)
* Optimizer: AdamW
* Augmentations:

  * Random Flip
  * Rotation
  * Color Jitter
* Dataset: Real vs AI images
* Best model saved using validation accuracy

---

## ⚙️ How It Works

1. User uploads image via frontend
2. Image sent to FastAPI backend
3. Image is preprocessed (resize, normalize)
4. Passed through trained model
5. Sigmoid converts output → probability
6. Prediction returned:

   * AI Generated
   * Real Image
   * Uncertain

---

## 📊 Confidence Logic

* Model outputs probability of AI
* Confidence is derived as:

```
AI → confidence = prob
Real → confidence = 1 - prob
```

* Thresholds:

  * > 0.7 → AI
  * < 0.3 → Real
  * otherwise → Uncertain

---

## ⚠️ Limitations

* Struggles with highly realistic AI images
* Performance depends heavily on dataset quality
* Requires diverse and high-quality training data

---

## 🚀 Future Improvements

* Add more realistic AI datasets (Midjourney, SDXL)
* Frequency-domain analysis
* Grad-CAM visualization
* Multi-model ensemble
* Deployment (Vercel + Render)

---

## 👨‍💻 Author

Built as an end-to-end AI Engineering project.
