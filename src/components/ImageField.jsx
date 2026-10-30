import { useEffect, useRef, useState } from "react";
import { Crop, ImagePlus, WandSparkles } from "lucide-react";
import ImageCropEditor from "./ImageCropEditor";
import {
  prepareCropSource,
  prepareImageFile,
  prepareCutoutFile,
  prepareCutoutSource,
  createProductCutout,
} from "../application/imageEditing";
import "./ImageField.css";
const formats = {
  product: { aspect: 4 / 3, maxWidth: 1200 },
  logo: { aspect: 1, maxWidth: 512 },
  cover: { aspect: 16 / 9, maxWidth: 1600 },
  cutout: { aspect: 1, maxWidth: 1600 },
};
function Preview({ src, label, aspect, kind, sourceImage }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <small className="image-preview-error">
      Não foi possível carregar a prévia deste endereço.
    </small>
  ) : (
    <figure
      className={`image-field-preview image-preview-${kind} ${kind === "cutout" && sourceImage ? "image-preview-comparison" : ""}`}
    >
      {kind === "cutout" && sourceImage && (
        <div className="image-comparison-original">
          <img
            src={sourceImage}
            alt="Foto do cardápio antes da remoção"
            style={{ aspectRatio: 1 }}
          />
          <small>Foto do cardápio</small>
        </div>
      )}
      <div>
        <img
          src={src}
          alt={`Prévia de ${label}`}
          style={{ aspectRatio: aspect }}
          onError={() => setFailed(true)}
        />
        {kind === "cutout" && sourceImage && <small>Sem fundo · cardápio</small>}
      </div>
      <figcaption>
        Prévia da imagem ·{" "}
        {kind === "cutout"
          ? "sem fundo"
          : kind === "logo"
            ? "quadrada"
            : kind === "cover"
              ? "capa"
              : "produto"}
      </figcaption>
    </figure>
  );
}
export default function ImageField({
  label = "Imagem",
  value,
  onChange,
  kind = "product",
  onEditingChange,
  onCutoutChange,
  sourceImage,
  disabled = false,
}) {
  const [error, setError] = useState(""),
    [candidate, setCandidate] = useState(null),
    [loading, setLoading] = useState(false),
    [progress, setProgress] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const format = formats[kind] || formats.product;
  const cancel = () => {
    controller.current?.abort();
    setCandidate(null);
    setLoading(false);
    setError("");
    onEditingChange?.(false);
  };
  const start = async (file, removeBackground = false, fromSource = value) => {
    if (disabled) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setError("");
    setCandidate(null);
    setLoading(true);
    setProgress(removeBackground ? "Preparando a remoção do fundo…" : "Preparando prévia…");
    onEditingChange?.(true);
    try {
      const report = (message) => {
        if (!current.signal.aborted) setProgress(message);
      };
      const source = removeBackground
        ? file
          ? await prepareCutoutFile(file, current.signal, report)
          : await prepareCutoutSource(fromSource, current.signal, report)
        : file
          ? await prepareImageFile(file, current.signal)
          : await prepareCropSource(fromSource, current.signal);
      if (!current.signal.aborted) setCandidate(source);
    } catch (e) {
      if (!current.signal.aborted) {
        setError(
          e.name === "DomainError"
            ? e.message
            : "Não foi possível preparar a imagem. Tente outro arquivo.",
        );
        onEditingChange?.(false);
      }
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  };
  const apply = async (result) => {
    const current = controller.current;
    if (current?.signal.aborted) return;
    if (onCutoutChange) {
      setError("");
      setLoading(true);
      setProgress("Removendo o fundo do produto…");
      try {
        const cutout = await createProductCutout(candidate.src, current?.signal, (message) => {
          if (!current?.signal.aborted) setProgress(message);
        });
        if (current?.signal.aborted) return;
        onChange(result);
        onCutoutChange(cutout);
      } catch (e) {
        if (!current?.signal.aborted)
          setError(
            e.name === "DomainError"
              ? e.message
              : "Não foi possível remover o fundo. Tente novamente. As fotos anteriores foram mantidas.",
          );
        return;
      } finally {
        if (!current?.signal.aborted) setLoading(false);
      }
    } else onChange(result);
    setCandidate(null);
    onEditingChange?.(false);
  };
  return (
    <div className="field image-field">
      <label>
        {label}
        <input
          type="text"
          value={value?.startsWith("data:") ? "Arquivo local selecionado" : value || ""}
          readOnly={value?.startsWith("data:")}
          disabled={disabled || loading || !!candidate}
          onChange={(e) => {
            setError("");
            onChange(e.target.value);
          }}
          placeholder="https://..."
        />
      </label>
      <div className="image-field-actions">
        <label className="button button-outline button-small">
          <ImagePlus size={14} /> Escolher arquivo
          <input
            className="sr-only"
            aria-label={`Escolher arquivo para ${label}`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled || loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) start(file, kind === "cutout");
            }}
          />
        </label>
        {kind === "cutout" && (sourceImage || value) && !candidate && !loading && (
          <button
            type="button"
            className="button button-outline button-small"
            disabled={disabled}
            onClick={() => start(undefined, true, sourceImage || value)}
          >
            <WandSparkles size={14} /> {sourceImage ? "Gerar da foto do produto" : "Remover fundo"}
          </button>
        )}
        {value && !candidate && !loading && (
          <>
            <button
              type="button"
              className="button button-outline button-small"
              disabled={disabled}
              onClick={() => start()}
            >
              <Crop size={14} /> Ajustar enquadramento
            </button>
            <button
              type="button"
              className="text-link"
              disabled={disabled}
              onClick={() => {
                setError("");
                onChange("");
              }}
            >
              Remover imagem
            </button>
          </>
        )}
      </div>
      {loading && (
        <div className="image-reading" role="status">
          {progress || "Preparando prévia…"}{" "}
          <button type="button" className="text-link" onClick={cancel}>
            Cancelar seleção
          </button>
        </div>
      )}
      {candidate && !loading ? (
        <ImageCropEditor
          key={candidate.src}
          source={candidate}
          aspect={kind === "cutout" ? candidate.width / candidate.height : format.aspect}
          maxWidth={format.maxWidth}
          label={label}
          onCancel={cancel}
          onApply={apply}
        />
      ) : (
        value &&
        /^(https?:\/\/|data:image\/|\/[^/])/i.test(value) && (
          <Preview
            key={value}
            src={value}
            label={label}
            aspect={format.aspect}
            kind={kind}
            sourceImage={sourceImage}
          />
        )
      )}
      {error && (
        <small className="form-error" role="alert">
          {error}
        </small>
      )}
      <small>
        {kind === "cutout"
          ? "JPEG, PNG ou WebP, até 10 MB. Remoção automática no navegador; confira as bordas antes de aplicar. O modelo é carregado na primeira utilização. Resultado até 500 KB."
          : "PNG, JPEG ou WebP de até 10 MB. Ajuste e aplique o recorte antes de salvar. A imagem final terá até 500 KB."}
      </small>
    </div>
  );
}
