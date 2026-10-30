import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const photo = fs.readFileSync("public/images/menu-brasa-only.png");
const digest = crypto.createHash("sha256").update(photo).digest("hex");
const code = (source, id) => ({
  cell_type: "code", execution_count: null, id, metadata: {}, outputs: [],
  source: source.split(/(?<=\n)/),
});
const setup = `# Execução interativa; GPU gratuita, sem montar Drive ou usar API paga.
import os, sys, subprocess, pathlib, torch
assert torch.cuda.is_available(), 'Selecione GPU T4 em Ambiente de execução > Alterar tipo de ambiente de execução.'
print('GPU:', torch.cuda.get_device_name(0), flush=True)
root = pathlib.Path('/content/pedss-triposr')
root.mkdir(exist_ok=True)
repo = root / 'TripoSR'
if not (repo / '.git').exists():
    subprocess.run(['git', 'clone', '--depth', '1', 'https://github.com/VAST-AI-Research/TripoSR.git', str(repo)], check=True)
subprocess.run(['git', '-C', str(repo), 'checkout', '107cefdc244c39106fa830359024f6a2f1c78871'], check=True)
print('TripoSR commit:', subprocess.check_output(['git', '-C', str(repo), 'rev-parse', 'HEAD'], text=True).strip(), flush=True)
venv = root / 'venv'
if not (venv / 'bin/pip').exists():
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'virtualenv'], check=True)
    subprocess.run([sys.executable, '-m', 'virtualenv', '--system-site-packages', str(venv)], check=True)
py = str(venv / 'bin/python')
subprocess.run([py, '-m', 'pip', 'install', '--disable-pip-version-check', 'omegaconf==2.3.0', 'einops==0.7.0', 'transformers==4.39.0', 'huggingface-hub>=0.25,<1', 'trimesh>=4.4,<5', 'rembg[cpu]', 'imageio[ffmpeg]', 'ninja', 'cmake', 'scikit-build-core', 'pybind11'], check=True)
subprocess.run([py, '-m', 'pip', 'install', '--no-build-isolation', 'git+https://github.com/tatsy/torchmcubes.git'], check=True)
print('DEPENDENCIAS_PRONTAS', flush=True)
`;
const generate = `# Somente a foto autorizada do Brasa Original, sem dados do sistema.
import base64, hashlib, json, textwrap
photo = base64.b64decode('${photo.toString("base64")}')
assert hashlib.sha256(photo).hexdigest() == '${digest}'
(root / 'brasa-original.png').write_bytes(photo)
runner = r'''
import time, json, pathlib, numpy as np, torch
from PIL import Image
from tsr.system import TSR
from tsr.utils import resize_foreground, to_gradio_3d_orientation
root = pathlib.Path('/content/pedss-triposr')
assert torch.cuda.is_available(), 'GPU indisponível'
torch.manual_seed(42)
start = time.time()
image = resize_foreground(Image.open(root / 'brasa-original.png').convert('RGBA'), 0.85)
rgba = np.asarray(image, dtype=np.float32) / 255.0
rgb = Image.fromarray(np.uint8(np.clip((rgba[..., :3] * rgba[..., 3:] + 0.5 * (1-rgba[..., 3:])) * 255, 0, 255)))
rgb.save(root / 'entrada-processada.png')
print('CARREGANDO_MODELO', flush=True)
model = TSR.from_pretrained('stabilityai/TripoSR', config_name='config.yaml', weight_name='model.ckpt')
model.renderer.set_chunk_size(8192)
model.to('cuda:0').eval()
with torch.inference_mode():
    print('INFERENCIA', flush=True)
    scene = model([rgb], device='cuda:0')
    print('EXTRAINDO_MALHA', flush=True)
    mesh = model.extract_mesh(scene, has_vertex_color=True, resolution=256)[0]
mesh = to_gradio_3d_orientation(mesh)
out = root / 'brasa-original-triposr.glb'
mesh.export(out)
assert out.read_bytes()[:4] == b'glTF'
info = dict(file=out.name, bytes=out.stat().st_size, vertices=len(mesh.vertices), faces=len(mesh.faces), seconds=round(time.time()-start, 2), source='menu-brasa-only.png', photo_sha256='${digest}', generator='stabilityai/TripoSR', geometry='AI estimated hidden sides; vertex colors')
(root / 'resultado.json').write_text(json.dumps(info, indent=2))
print('GLB_PRONTO', json.dumps(info), flush=True)
'''
(repo / 'pedss_generate.py').write_text(textwrap.dedent(runner))
subprocess.run([py, '-u', str(repo / 'pedss_generate.py')], cwd=repo, check=True)
print((root / 'resultado.json').read_text(), flush=True)
`;
const download = `from google.colab import files
files.download('/content/pedss-triposr/brasa-original-triposr.glb')
`;
const notebook = {
  nbformat: 4, nbformat_minor: 5,
  metadata: { accelerator: "GPU", colab: { name: "Pedss - Brasa Original - TripoSR.ipynb", provenance: [], gpuType: "T4" }, kernelspec: { display_name: "Python 3", name: "python3" }, language_info: { name: "python" } },
  cells: [
    { cell_type: "markdown", id: "scope", metadata: {}, source: ["# Pedss — Brasa Original em 3D\n", "Teste autorizado: foto do produto do **cardápio**, hero independente.\n", "GPU gratuita T4; não selecionar ambiente pago. Execute preparar, gerar e baixar, nessa ordem. Não monta Google Drive, não usa token nem API paga. O modelo estima partes escondidas. Revisar o GLB antes de vinculá-lo ao produto.\n", "Código/modelo: [TripoSR oficial](https://github.com/VAST-AI-Research/TripoSR), licença MIT. Geração com cores nos vértices, sem prometer reprodução fotográfica do verso.\n"] },
    code(setup, "prepare"), code(generate, "generate"), code(download, "download"),
  ],
};
fs.mkdirSync("notebooks", { recursive: true });
const target = path.resolve("notebooks/brasa-original-triposr.ipynb");
fs.writeFileSync(target, JSON.stringify(notebook));
console.log(JSON.stringify({ path: target, bytes: fs.statSync(target).size, photoSha256: digest }));
