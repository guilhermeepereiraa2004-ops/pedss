import { useRef, useState } from "react";
import { Check, Move, RotateCcw, ZoomIn } from "lucide-react";
import { imageCrop } from "../core/imageCrop.ts";
import { applyImageCrop } from "../application/imageEditing";
import { useAction } from "../hooks/useApplication";

export default function ImageCropEditor({ source, aspect, maxWidth, label, onApply, onCancel }) {
  const [zoom, setZoom] = useState(1),
    [horizontal, setHorizontal] = useState(50),
    [vertical, setVertical] = useState(50);
  const drag = useRef(null),
    action = useAction();
  const area = imageCrop(source.width, source.height, aspect, zoom, horizontal, vertical);
  return (
    <section className="image-crop-editor" aria-label={`Recortar ${label}`}>
      <div className="image-crop-heading">
        <span>
          <Move size={15} /> Ajuste o enquadramento
        </span>
        <small>Prévia do recorte</small>
      </div>
      <div
        className="image-crop-viewport"
        style={{ aspectRatio: aspect }}
        onPointerDown={(e) => {
          if (action.busy || (e.pointerType === "mouse" && e.button !== 0)) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            horizontal,
            vertical,
            area,
            rect: e.currentTarget.getBoundingClientRect(),
          };
        }}
        onPointerMove={(e) => {
          const start = drag.current;
          if (!start || action.busy) return;
          if (source.width > start.area.width)
            setHorizontal(
              Math.max(
                0,
                Math.min(
                  100,
                  start.horizontal -
                    ((((e.clientX - start.x) / start.rect.width) * start.area.width) /
                      (source.width - start.area.width)) *
                      100,
                ),
              ),
            );
          if (source.height > start.area.height)
            setVertical(
              Math.max(
                0,
                Math.min(
                  100,
                  start.vertical -
                    ((((e.clientY - start.y) / start.rect.height) * start.area.height) /
                      (source.height - start.area.height)) *
                      100,
                ),
              ),
            );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <img
          src={source.src}
          alt={`Prévia do recorte de ${label}`}
          draggable={false}
          style={{
            width: `${(source.width / area.width) * 100}%`,
            height: `${(source.height / area.height) * 100}%`,
            left: `${(-area.x / area.width) * 100}%`,
            top: `${(-area.y / area.height) * 100}%`,
          }}
        />
        <span className="image-crop-grid" aria-hidden="true" />
      </div>
      <p className="image-crop-help">
        Arraste a imagem ou use os controles para ajustar. O recorte só será aplicado ao confirmar.
      </p>
      <label className="image-crop-control">
        <span>
          <ZoomIn size={14} /> Zoom <output>{zoom.toFixed(1)}×</output>
        </span>
        <input
          type="range"
          aria-label="Zoom"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          disabled={action.busy}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </label>
      <div className="image-crop-position">
        <label className="image-crop-control">
          <span>Posição horizontal</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={horizontal}
            disabled={action.busy || source.width - area.width < 0.01}
            onChange={(e) => setHorizontal(Number(e.target.value))}
          />
        </label>
        <label className="image-crop-control">
          <span>Posição vertical</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={vertical}
            disabled={action.busy || source.height - area.height < 0.01}
            onChange={(e) => setVertical(Number(e.target.value))}
          />
        </label>
      </div>
      {action.error && (
        <p className="form-error" role="alert">
          {action.error}
        </p>
      )}
      <div className="image-crop-actions">
        <button
          type="button"
          className="text-link"
          disabled={action.busy}
          onClick={() => {
            setZoom(1);
            setHorizontal(50);
            setVertical(50);
            action.setError("");
          }}
        >
          <RotateCcw size={13} /> Redefinir
        </button>
        <button
          type="button"
          className="button button-outline button-small"
          disabled={action.busy}
          onClick={onCancel}
        >
          Cancelar recorte
        </button>
        <button
          type="button"
          className="button button-dark button-small"
          disabled={action.busy}
          onClick={() => action.run(() => applyImageCrop(source.src, area, maxWidth), onApply)}
        >
          <Check size={14} />
          {action.busy ? "Preparando…" : "Aplicar recorte"}
        </button>
      </div>
    </section>
  );
}
