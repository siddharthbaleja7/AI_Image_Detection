import torch
from .model_loader import load_model

model = load_model()
model.eval()

def predict(tensor):

    with torch.no_grad():
        output = model(tensor)

        prob = torch.sigmoid(output).item()

        if prob > 0.5:
            label = "AI / Synthetic"
        else:
            label = "Real Image"

    return label, prob