import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { X, Check, Sparkles, Upload, Image as ImageIcon, Folder } from 'lucide-react';

export interface IconOption {
  id: string;
  name: string;
  subtitle: string;
  url: string;
}

export const PRESET_ICONS: IconOption[] = [
  {
    id: 'neon-flame',
    name: 'Neon Flame',
    subtitle: 'Vibrant Rose & Amber glow (Default)',
    url: '/favicon.svg',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    subtitle: 'Electric Indigo & Cyan wave',
    url: '/icons/icon-cyber-violet.svg',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    subtitle: 'High-tech Mint & Emerald energy',
    url: '/icons/icon-emerald-matrix.svg',
  },
  {
    id: 'minimal-dark',
    name: 'Minimal Obsidian',
    subtitle: 'Stealth monochrome white on black',
    url: '/icons/icon-minimal-dark.svg',
  },
];

interface AppIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIconUrl: string;
  onSelectIcon: (url: string) => void;
}

export const AppIconModal = ({
  isOpen,
  onClose,
  activeIconUrl,
  onSelectIcon,
}: AppIconModalProps) => {
  const [customInputUrl, setCustomInputUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle direct file upload from user device (phone/PC)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsProcessing(false);
        return;
      }

      // Render image onto a high-res squircle canvas (512x512)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Draw rounded squircle clipping path
          const radius = 110;
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(512 - radius, 0);
          ctx.quadraticCurveTo(512, 0, 512, radius);
          ctx.lineTo(512, 512 - radius);
          ctx.quadraticCurveTo(512, 512, 512 - radius, 512);
          ctx.lineTo(radius, 512);
          ctx.quadraticCurveTo(0, 512, 0, 512 - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
          ctx.clip();

          // Scale and center crop image
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);

          const finalDataUrl = canvas.toDataURL('image/png', 0.95);
          onSelectIcon(finalDataUrl);
          setIsProcessing(false);
          onClose();
        } else {
          onSelectIcon(dataUrl);
          setIsProcessing(false);
          onClose();
        }
      };
      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    onSelectIcon(customInputUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm backdrop-blur-3xl bg-zinc-950/90 border border-white/10 rounded-3xl p-5 shadow-[0_20px_60px_0_rgba(0,0,0,0.8)] space-y-4 text-left max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-zinc-100">Set Favicon & App Icon</h2>
              <p className="text-[10px] text-zinc-400">Upload your own photo or choose a style</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option 1: Direct Photo Upload from Device (Instant!) */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Upload Your Own Photo
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 border border-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Photo...' : 'Choose Photo from Device (JPG/PNG)'}</span>
          </button>

          <p className="text-[10px] text-zinc-400 text-center">
            Automatically crops & optimizes your photo as the browser favicon and app icon.
          </p>
        </div>

        {/* Option 2: Preset Icon Styles */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Or Choose Preset Themes
          </label>

          <div className="space-y-1.5">
            {PRESET_ICONS.map((icon) => {
              const isSelected = activeIconUrl === icon.url;
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => {
                    onSelectIcon(icon.url);
                    onClose();
                  }}
                  className={`w-full p-2 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'backdrop-blur-md bg-white/[0.08] border-rose-500/50 shadow-md shadow-rose-500/10'
                      : 'backdrop-blur-md bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shadow-md shrink-0 bg-black">
                      <img src={icon.url} alt={icon.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                        <span>{icon.name}</span>
                        {isSelected && (
                          <span className="text-[8px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400">{icon.subtitle}</div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                        : 'border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Option 3: Manual Project File Folder Info */}
        <div className="pt-2 border-t border-white/5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            Manual File Location
          </div>
          <div className="p-2.5 rounded-xl backdrop-blur-md bg-white/[0.03] border border-white/10 text-[11px] text-zinc-300 font-mono break-all space-y-1">
            <p className="text-zinc-400 font-sans text-[10px]">
              You can also copy your photo file directly into this folder:
            </p>
            <p className="text-rose-300 font-semibold selection:bg-rose-500/30">
              d:\waste\To do application\public\favicon.svg
            </p>
            <p className="text-[10px] text-zinc-400 font-sans">
              (or save as <code className="text-zinc-200">public/favicon.png</code>)
            </p>
          </div>
        </div>

        {/* Option 4: Custom Image URL */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Upload className="w-3 h-3 text-rose-400" />
            Image URL
          </label>
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5">
            <input
              type="url"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="flex-1 py-1.5 px-3 text-xs rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-400/50"
            />
            <button
              type="submit"
              disabled={!customInputUrl.trim()}
              className="py-1.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-xs font-bold text-zinc-200 transition-all disabled:opacity-40"
            >
              Apply
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
