import { useRef } from "react";
import Button from "../../../components/ui/Button";

export default function SignaturePad({ onChange, disabled }) {
  const canvas = useRef(null),
    drawing = useRef(false);
  const point = (event) => {
    const rect = canvas.current.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * 700) / rect.width,
      ((event.clientY - rect.top) * 180) / rect.height,
    ];
  };
  const finish = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const ctx = canvas.current.getContext("2d"),
      pixels = ctx.getImageData(0, 0, 700, 180);
    let left = 700,
      right = -1,
      top = 180,
      bottom = -1;
    for (let y = 0; y < 180; y++)
      for (let x = 0; x < 700; x++)
        if (pixels.data[(y * 700 + x) * 4 + 3] > 30) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    if (right - left < 3 || bottom - top < 2) {
      onChange(null);
      return;
    }
    const cropped = document.createElement("canvas");
    cropped.width = right - left + 1;
    cropped.height = bottom - top + 1;
    cropped
      .getContext("2d")
      .drawImage(
        canvas.current,
        left,
        top,
        cropped.width,
        cropped.height,
        0,
        0,
        cropped.width,
        cropped.height
      );
    onChange(cropped.toDataURL("image/png"));
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Draw your signature</p>
        <Button
          text="Clear"
          variant="secondary"
          disabled={disabled}
          className="text-xs"
          onClick={() => {
            canvas.current.getContext("2d").clearRect(0, 0, 700, 180);
            onChange(null);
          }}
        />
      </div>
      <canvas
        ref={canvas}
        width={700}
        height={180}
        className="signature-pad block w-full touch-none rounded-sm border border-dashed border-gray-400"
        aria-label="Draw signature for this page"
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          const ctx = canvas.current.getContext("2d");
          ctx.beginPath();
          ctx.moveTo(...point(event));
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#111827";
        }}
        onPointerMove={(event) => {
          if (drawing.current) {
            const ctx = canvas.current.getContext("2d");
            ctx.lineTo(...point(event));
            ctx.stroke();
          }
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
      />
      <p className="text-xs text-gray-500">
        Draw at any size. The final signature fits a fixed 220 × 80 pt box without stretching.
      </p>
    </div>
  );
}
