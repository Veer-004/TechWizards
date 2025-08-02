# train_model.py

import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from torch.nn.utils.rnn import pad_sequence
from collections import Counter
import re
import pickle

# ----------------------------- CONFIG -----------------------------
CSV_PATH = "issues.csv"
EMBED_DIM = 100
EPOCHS = 10
BATCH_SIZE = 16
LEARNING_RATE = 0.001
# ------------------------------------------------------------------

# Load and clean data
df = pd.read_csv(CSV_PATH)
df.dropna(inplace=True)
texts = df["description"].apply(lambda x: re.sub(r"[^a-z0-9\s]", "", str(x).lower())).tolist()
labels = df["category"].tolist()

# Label Encoding
label_encoder = LabelEncoder()
encoded_labels = torch.tensor(label_encoder.fit_transform(labels))

# Tokenization and Vocabulary
def tokenize(text):
    return re.findall(r'\b\w+\b', text)

tokenized_texts = [tokenize(text) for text in texts]
word_counts = Counter(word for sentence in tokenized_texts for word in sentence)
vocab = {word: i+2 for i, (word, _) in enumerate(word_counts.most_common())}
vocab["<PAD>"] = 0
vocab["<UNK>"] = 1

def numericalize(tokens):
    return torch.tensor([vocab.get(token, vocab["<UNK>"]) for token in tokens])

numericalized_texts = [numericalize(tokens) for tokens in tokenized_texts]
padded_texts = pad_sequence(numericalized_texts, batch_first=True)

# Dataset + Dataloader
class IssueDataset(Dataset):
    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __getitem__(self, idx):
        return self.texts[idx], self.labels[idx]

    def __len__(self):
        return len(self.labels)

X_train, X_test, y_train, y_test = train_test_split(padded_texts, encoded_labels, test_size=0.2, random_state=42)
train_loader = DataLoader(IssueDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)

# Model
class TextClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, num_classes):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.fc = nn.Linear(embed_dim, num_classes)

    def forward(self, x):
        x = self.embedding(x)
        x = x.mean(dim=1)
        return self.fc(x)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = TextClassifier(vocab_size=len(vocab), embed_dim=EMBED_DIM, num_classes=len(label_encoder.classes_))
model.to(device)

# Training
loss_fn = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    for batch_x, batch_y in train_loader:
        batch_x, batch_y = batch_x.to(device), batch_y.to(device)

        optimizer.zero_grad()
        output = model(batch_x)
        loss = loss_fn(output, batch_y)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    print(f"Epoch {epoch+1}/{EPOCHS} - Loss: {total_loss:.4f}")

# Save artifacts
torch.save(model.state_dict(), "model.pth")

with open("vocab.pkl", "wb") as f:
    pickle.dump(vocab, f)

with open("label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

print("✅ Training complete. Artifacts saved: model.pth, vocab.pkl, label_encoder.pkl")
