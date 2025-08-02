import torch
import torch.nn as nn
import pickle
import re
import os

# ---------- CONFIG ----------
EMBED_DIM = 100
MAX_LEN = 20
# ----------------------------

# Absolute path resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load vocab and label encoder
with open(os.path.join(BASE_DIR, "vocab.pkl"), "rb") as f:
    vocab = pickle.load(f)

with open(os.path.join(BASE_DIR, "label_encoder.pkl"), "rb") as f:
    label_encoder = pickle.load(f)

# Preprocessing functions
def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text

def tokenize(text):
    return re.findall(r'\b\w+\b', text.lower())

def text_to_tensor(text, max_len=MAX_LEN):
    tokens = tokenize(text)
    token_ids = [vocab.get(t, vocab["<UNK>"]) for t in tokens[:max_len]]
    return torch.tensor(token_ids + [0] * (max_len - len(token_ids))).unsqueeze(0)

# Rule-based fallback
keyword_rules = {
    "pothole": "Roads",
    "sewage": "Sanitation",
    "garbage": "Cleanliness",
    "trash": "Cleanliness",
    "plastic": "Cleanliness",
    "water": "Water Supply",
    "leakage": "Water Supply",
    "light": "Lighting",
    "electricity": "Lighting",
    "streetlight": "Lighting",
    "traffic": "Public Safety",
    "accident": "Public Safety",
    "noise": "Public Safety",
    "tree": "Obstructions",
    "fallen tree": "Obstructions",
    "mosquito": "Public Safety",
    "drain": "Sanitation",
    "manhole": "Sanitation",
}

def check_keywords(text):
    for keyword, label in keyword_rules.items():
        if keyword in text.lower():
            return label
    return None

# ✅ Define model class before using it
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.embedding(x)
        x = x.mean(dim=1)
        return self.fc(x)

# ✅ Now instantiate the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TextClassifier(
    vocab_size=len(vocab),
    embed_dim=EMBED_DIM,
    num_classes=len(label_encoder.classes_)
)
model.load_state_dict(torch.load(os.path.join(BASE_DIR, "model.pth"), map_location=device))
model.to(device)
model.eval()

# ✅ Prediction function
def predict_category(text: str) -> str:
    text = clean_text(text)
    
    # Check rule-based fallback first
    keyword_label = check_keywords(text)
    if keyword_label:
        return keyword_label
    
    input_tensor = text_to_tensor(text).to(device)
    with torch.no_grad():
        output = model(input_tensor)
        pred_idx = torch.argmax(output, dim=1).item()
        pred_label = label_encoder.inverse_transform([pred_idx])[0]
    return pred_label
