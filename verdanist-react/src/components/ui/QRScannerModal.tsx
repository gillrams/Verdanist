import { useEffect, useState, useRef } from 'react';
import { X, Image as ImageIcon, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from 'jsqr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (text: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [hasCamera, setHasCamera] = useState(true);
  const [useImage, setUseImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setUseImage(false);
      setErrorMsg('');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          onScanSuccess(code.data);
        } else {
          setErrorMsg('QR Code tidak terdeteksi dalam gambar.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-[2rem] shadow-lg border border-border overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Scan QR Token</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Arahkan kamera ke QR Code yang diberikan oleh admin kebun Anda.
          </p>

          <div className="flex gap-2 justify-center mb-6">
            <button
              onClick={() => setUseImage(false)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${!useImage ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              <Camera className="w-4 h-4" />
              Kamera
            </button>
            <button
              onClick={() => setUseImage(true)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${useImage ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              <ImageIcon className="w-4 h-4" />
              Gambar
            </button>
          </div>

          {useImage ? (
            <div className="aspect-square bg-secondary rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
              <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium text-foreground mb-1">Unggah dari Galeri</p>
              <p className="text-sm text-muted-foreground mb-4">
                Pilih gambar QR code untuk dipindai.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Pilih Gambar
              </button>
              {errorMsg && (
                <p className="text-destructive text-sm mt-4">{errorMsg}</p>
              )}
            </div>
          ) : hasCamera ? (
            <div className="rounded-2xl overflow-hidden border-2 border-primary/20 relative aspect-square bg-black">
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                    onScanSuccess(result[0].rawValue);
                  }
                }}
                onError={(error) => {
                  console.error(error);
                  if (error?.message?.includes('Permission denied')) {
                     setHasCamera(false);
                  }
                }}
                formats={['qr_code']}
              />
            </div>
          ) : (
            <div className="aspect-square bg-secondary rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-border">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                <X className="w-6 h-6" />
              </div>
              <p className="font-semibold text-foreground mb-2">Kamera Tidak Tersedia</p>
              <p className="text-sm text-muted-foreground">
                Tolong izinkan akses kamera di browser Anda, atau pastikan perangkat memiliki kamera.
              </p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
