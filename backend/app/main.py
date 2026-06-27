from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image, UnidentifiedImageError
import io

from .preprocess import preprocess_image
from .inference import predict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "AI Image Detector Backend Running"}


@app.post("/predict")
async def predict_api(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image file format. Please upload a valid JPEG, PNG, or WEBP image.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image file: {str(e)}")

    tensor = preprocess_image(image)

    label, prob = predict(tensor)

    return {
        "filename": file.filename,
        "prediction": label,
        "confidence": round(prob, 3)
    }