import timm
import torch

def load_model():
    model = timm.create_model(
        "convnext_base",
        pretrained=False,   # ❗ IMPORTANT
        num_classes=1
    )

    # 🔥 Load NEW trained model
    model.load_state_dict(
        torch.load("models/best_model.pth", map_location="cpu")
    )

    model.eval()

    return model