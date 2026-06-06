import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (text: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [hasCamera, setHasCamera] = useState(true);

  // Stop body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

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

          {hasCamera ? (
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
