# training/train_wound_segmentation.py
"""
Skrip Pelatihan Model Segmentasi Luka U-Net Menggunakan PyTorch
Dibuat untuk Tugas Akhir Sistem Multimedia UNNES.

Skrip ini membaca dataset dari folder CO2Wounds-V2, melakukan pelatihan segmentasi semantik,
menghitung metrik Dice Coefficient & IoU, serta mengekspor model terlatih ke format ONNX
untuk kemudian dikonversi ke TensorFlow.js (TFJS).
"""

import os
import glob
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import torchvision.transforms as transforms

# Konfigurasi Parameter
BATCH_SIZE = 8
EPOCHS = 15
LEARNING_RATE = 1e-4
IMAGE_SIZE = (256, 256)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Path Dataset
DATASET_DIR = "../CO2Wounds-V2 Extended Chronic Wounds Dataset From Leprosy Patients"
IMGS_DIR = os.path.join(DATASET_DIR, "imgs")
MASKS_DIR = os.path.join(DATASET_DIR, "masks")

# ==========================================
# 1. DEFINISI DATASET CUSTOM
# ==========================================
class WoundDataset(Dataset):
    def __init__(self, image_paths, mask_paths, transform=None):
        self.image_paths = sorted(image_paths)
        self.mask_paths = sorted(mask_paths)
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        # Load citra asli (RGB)
        image = Image.open(self.image_paths[idx]).convert("RGB")
        # Load masker biner (Grayscale)
        mask = Image.open(self.mask_paths[idx]).convert("L")

        if self.transform:
            image, mask = self.transform(image, mask)
        
        return image, mask

# Transformasi Data & Augmentasi
class JointTransform:
    def __init__(self, size=(256, 256), train=True):
        self.size = size
        self.train = train

    def __call__(self, image, mask):
        # Resize awal
        image = transforms.Resize(self.size)(image)
        mask = transforms.Resize(self.size, interpolation=transforms.InterpolationMode.NEAREST)(mask)

        # Augmentasi acak untuk Data Training
        if self.train:
            # Flip Horizontal Acak
            if np.random.rand() > 0.5:
                image = transforms.functional.hflip(image)
                mask = transforms.functional.hflip(mask)
            
            # Flip Vertikal Acak
            if np.random.rand() > 0.5:
                image = transforms.functional.vflip(image)
                mask = transforms.functional.vflip(mask)
                
            # Rotasi Acak
            angle = np.random.uniform(-15, 15)
            image = transforms.functional.rotate(image, angle)
            mask = transforms.functional.rotate(mask, angle)

        # Konversi ke Tensor & Normalisasi
        image = transforms.ToTensor()(image)
        # Normalisasi ImageNet standar
        image = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])(image)
        
        # Konversi Masker ke biner 0 dan 1
        mask = transforms.ToTensor()(mask)
        mask = (mask > 0.5).float() # Thresholding ke 0.0 atau 1.0

        return image, mask

# ==========================================
# 2. ARSITEKTUR JARINGAN U-NET (PYTORCH)
# ==========================================
class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(DoubleConv, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, out_channels=1):
        super(UNet, self).__init__()
        self.downs = nn.ModuleList()
        self.ups = nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        
        # Encoder (Downsampling)
        features = [64, 128, 256, 512]
        current_in = in_channels
        for feature in features:
            self.downs.append(DoubleConv(current_in, feature))
            current_in = feature
            
        # Bottleneck
        self.bottleneck = DoubleConv(features[-1], features[-1] * 2)
        
        # Decoder (Upsampling)
        for feature in reversed(features):
            self.ups.append(
                nn.ConvTranspose2d(feature * 2, feature, kernel_size=2, stride=2)
            )
            self.ups.append(DoubleConv(feature * 2, feature))
            
        self.final_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)

    def forward(self, x):
        skip_connections = []
        
        # Down
        for down in self.downs:
            x = down(x)
            skip_connections.append(x)
            x = self.pool(x)
            
        x = self.bottleneck(x)
        skip_connections = skip_connections[::-1]
        
        # Up
        for idx in range(0, len(self.ups), 2):
            x = self.ups[idx](x) # ConvTranspose
            skip_connection = skip_connections[idx // 2]
            
            # Gabungkan dengan skip connection
            concat_x = torch.cat((skip_connection, x), dim=1)
            x = self.ups[idx + 1](concat_x) # DoubleConv
            
        return torch.sigmoid(self.final_conv(x))

# ==========================================
# 3. FUNGSI KERUGIAN & METRIK EVALUASI
# ==========================================
class DiceBCELoss(nn.Module):
    def __init__(self, weight=None, size_average=True):
        super(DiceBCELoss, self).__init__()
        self.bce = nn.BCELoss()

    def forward(self, inputs, targets, smooth=1):
        # BCE Loss
        bce_loss = self.bce(inputs, targets)
        
        # Dice Loss
        inputs_flat = inputs.view(-1)
        targets_flat = targets.view(-1)
        
        intersection = (inputs_flat * targets_flat).sum()                            
        dice_loss = 1 - ((2. * intersection + smooth) / (inputs_flat.sum() + targets_flat.sum() + smooth))  
        
        # Kombinasi Hybrid Loss
        return bce_loss + dice_loss

def calculate_iou(preds, targets, smooth=1e-6):
    preds_bin = (preds > 0.5).float()
    intersection = (preds_bin * targets).sum()
    total = (preds_bin + targets).sum()
    union = total - intersection
    return (intersection + smooth) / (union + smooth)

def calculate_dice(preds, targets, smooth=1e-6):
    preds_bin = (preds > 0.5).float()
    intersection = (preds_bin * targets).sum()
    return (2. * intersection + smooth) / (preds_bin.sum() + targets.sum() + smooth)

# ==========================================
# 4. ALUR UTAMA TRAINING
# ==========================================
def main():
    print(f"Menggunakan Perangkat Komputasi: {DEVICE}")
    
    # Mencari pasangan citra dan masker yang memiliki nama file yang sama
    all_images = glob.glob(os.path.join(IMGS_DIR, "*"))
    image_paths = []
    mask_paths = []
    
    for img_path in all_images:
        base_name = os.path.basename(img_path)
        # Menghapus ekstensi (.jpg, .jpeg, .png)
        name_without_ext = os.path.splitext(base_name)[0]
        # Mencari masker dengan nama file yang sama (misal format PNG)
        mask_file = os.path.join(MASKS_DIR, f"{name_without_ext}.png")
        
        if os.path.exists(mask_file):
            image_paths.append(img_path)
            mask_paths.append(mask_file)
            
    print(f"Total data pasangan citra dan masker ditemukan: {len(image_paths)}")
    if len(image_paths) == 0:
        print("PERINGATAN: Tidak ada data yang ditemukan. Harap periksa folder dataset.")
        return
        
    # Split Data secara sederhana (80% Train, 20% Val)
    indices = np.arange(len(image_paths))
    np.random.seed(42)
    np.random.shuffle(indices)
    
    split_idx = int(len(image_paths) * 0.8)
    train_idx = indices[:split_idx]
    val_idx = indices[split_idx:]
    
    train_imgs = [image_paths[i] for i in train_idx]
    train_masks = [mask_paths[i] for i in train_idx]
    val_imgs = [image_paths[i] for i in val_idx]
    val_masks = [mask_paths[i] for i in val_idx]
    
    # DataLoaders
    train_dataset = WoundDataset(train_imgs, train_masks, transform=JointTransform(size=IMAGE_SIZE, train=True))
    val_dataset = WoundDataset(val_imgs, val_masks, transform=JointTransform(size=IMAGE_SIZE, train=False))
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    # Inisialisasi Model, Loss, dan Optimizer
    model = UNet(in_channels=3, out_channels=1).to(DEVICE)
    criterion = DiceBCELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # Loop Training
    print("\n--- Memulai Sesi Pelatihan ---")
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        
        for imgs, masks in train_loader:
            imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
            
            # Forward Pass
            preds = model(imgs)
            loss = criterion(preds, masks)
            
            # Backward Pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            
        # Evaluasi Validasi
        model.eval()
        val_loss = 0
        val_iou = 0
        val_dice = 0
        
        with torch.no_grad():
            for imgs, masks in val_loader:
                imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
                preds = model(imgs)
                
                loss = criterion(preds, masks)
                val_loss += loss.item()
                
                val_iou += calculate_iou(preds, masks).item()
                val_dice += calculate_dice(preds, masks).item()
                
        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        val_iou /= len(val_loader)
        val_dice /= len(val_loader)
        
        print(f"Epoch [{epoch+1:02d}/{EPOCHS:02d}] | "
              f"Train Loss: {train_loss:.4f} | "
              f"Val Loss: {val_loss:.4f} | "
              f"Val IoU: {val_iou:.4f} | "
              f"Val Dice (F1): {val_dice:.4f}")
              
    # Simpan bobot model dalam format PyTorch (.pth)
    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), "models/wound_unet_model.pth")
    print("\n[SUKSES] Bobot model berhasil disimpan di: models/wound_unet_model.pth")
    
    # ==========================================
    # 5. EKSPOR KE ONNX
    # ==========================================
    print("\n--- Mengekspor Model ke Format ONNX ---")
    model.eval()
    # Dummy input tensor mewakili 1 citra RGB resolusi 256x256
    dummy_input = torch.randn(1, 3, IMAGE_SIZE[0], IMAGE_SIZE[1], device=DEVICE)
    onnx_path = "models/wound_unet.onnx"
    
    torch.onnx.export(
        model, 
        dummy_input.to(DEVICE), 
        onnx_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
    )
    print(f"[SUKSES] Model ONNX berhasil diekspor ke: {onnx_path}")
    print("\nPetunjuk selanjutnya:")
    print("1. Install tensorflowjs untuk konversi ke web:")
    print("   pip install tensorflowjs onnx tf2onnx")
    print("2. Jalankan konversi ONNX ke TensorFlow.js (Format GraphModel):")
    print("   tensorflowjs_converter --input_format=onnx --output_node_names='output' models/wound_unet.onnx ../js/model")

if __name__ == "__main__":
    main()
