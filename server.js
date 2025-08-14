import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Configurar CORS
app.use(cors());
app.use(express.json()); // Para parsear JSON en el body de las peticiones

// Configurar multer para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Endpoint para subir imágenes
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const filename = req.file.filename;
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const originalUrl = `${baseUrl}/lovable-uploads/${filename}`;
    
    // Preparar respuesta con estructura mejorada
    const response = {
      success: true,
      filename: filename,
      path: `/lovable-uploads/${filename}`,
      original_url: originalUrl, // URL directa de la imagen original
      thumbnail_url: null, // Por ahora null, se implementará si el usuario lo pide
      analysis: null, // Por ahora null, se implementará si el usuario lo pide
      message: 'Imagen subida exitosamente sin modificaciones'
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Añadir: subir imagen por URL (sin modificaciones)
app.post('/api/upload-image-url', async (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'Falta imageUrl' });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'No se pudo descargar la imagen' });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'La URL no apunta a una imagen' });
    }

    // Determinar extensión por content-type o por la URL
    const mimeToExt = (mime) => {
      const map = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
      };
      return map[mime] || '';
    };

    let ext = mimeToExt(contentType);
    if (!ext) {
      const urlExt = path.extname(new URL(imageUrl).pathname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(urlExt)) {
        ext = urlExt;
      } else {
        ext = '.jpg';
      }
    }

    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `url-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const originalUrl = `${baseUrl}/lovable-uploads/${filename}`;

    return res.json({
      success: true,
      filename,
      path: `/lovable-uploads/${filename}`,
      original_url: originalUrl,
      thumbnail_url: null,
      analysis: null,
      message: 'Imagen importada por URL sin modificaciones'
    });
  } catch (error) {
    console.error('Error uploading image by URL:', error);
    return res.status(500).json({ error: 'Error al importar imagen por URL' });
  }
});

// Añadir: subir imagen por data URL base64 (sin modificaciones)
app.post('/api/upload-image-base64', async (req, res) => {
  try {
    const { dataUrl, suggestedName } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Falta dataUrl válido (data:image/*;base64,...)' });
    }

    // data:[mime];base64,[data]
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Formato de dataUrl inválido' });
    }

    const mime = match[1];
    const base64Data = match[2];

    const mimeToExt = (mime) => {
      const map = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg'
      };
      return map[mime] || '.jpg';
    };

    const ext = mimeToExt(mime);

    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeName = (suggestedName || 'image').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 32) || 'image';
    const filename = `${safeName}-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const originalUrl = `${baseUrl}/lovable-uploads/${filename}`;

    return res.json({
      success: true,
      filename,
      path: `/lovable-uploads/${filename}`,
      original_url: originalUrl,
      thumbnail_url: null,
      analysis: null,
      message: 'Imagen importada por base64 sin modificaciones'
    });
  } catch (error) {
    console.error('Error uploading image from base64:', error);
    return res.status(500).json({ error: 'Error al importar imagen por base64' });
  }
});

// Helper: subir buffer a GitHub (crea o actualiza si existe)
async function uploadBufferToGitHub(fileBuffer, filename, {
  owner = process.env.GITHUB_OWNER || 'Hiizzzo',
  repo = process.env.GITHUB_REPO || 'ste-be-assets',
  branch = process.env.GITHUB_BRANCH || 'main',
  token = process.env.GITHUB_TOKEN
} = {}) {
  if (!token) {
    throw new Error('Falta GITHUB_TOKEN en variables de entorno');
  }

  const pathInRepo = `uploads/${filename}`;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(pathInRepo)}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  // Verificar si el archivo existe para obtener su SHA
  let existingSha = undefined;
  const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
  if (getRes.status === 200) {
    const json = await getRes.json();
    existingSha = json.sha;
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub GET fallo: ${getRes.status} ${await getRes.text()}`);
  }

  const contentBase64 = fileBuffer.toString('base64');
  const body = {
    message: existingSha ? `update ${filename} from server` : `upload ${filename} from server`,
    content: contentBase64,
    branch,
    sha: existingSha
  };

  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  if (!putRes.ok) {
    throw new Error(`GitHub PUT fallo: ${putRes.status} ${await putRes.text()}`);
  }

  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURIComponent(pathInRepo)}`;
  return { rawUrl, pathInRepo };
}

// Endpoint: subir una imagen recibida y enviarla a GitHub
app.post('/api/github/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // Nombre final en el repo: se puede forzar con body.filename, o usar originalname
    const requestedName = (req.body && req.body.filename) ? String(req.body.filename) : req.file.originalname;
    const safeName = requestedName
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 128) || 'image.png';

    // Leer el archivo subido por multer (disco)
    const localPath = req.file.path;
    const buffer = fs.readFileSync(localPath);

    // Subir a GitHub
    const { rawUrl, pathInRepo } = await uploadBufferToGitHub(buffer, safeName);

    // Opcional: eliminar copia local
    try { fs.unlinkSync(localPath); } catch (_) {}

    return res.json({
      success: true,
      github_raw_url: rawUrl,
      github_path: pathInRepo,
      message: 'Imagen subida a GitHub correctamente'
    });
  } catch (error) {
    console.error('Error uploading image to GitHub:', error);
    return res.status(500).json({ error: error.message || 'Error al subir imagen a GitHub' });
  }
});

// Endpoint para generar thumbnail (solo si se solicita explícitamente)
app.post('/api/generate-thumbnail', async (req, res) => {
  try {
    const { filename, width = 200, height = 200 } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'No se proporcionó el nombre del archivo' });
    }
    
    const originalPath = path.join(__dirname, 'public', 'lovable-uploads', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(originalPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Generar nombre para el thumbnail
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const thumbnailFilename = `${basename}-thumb-${width}x${height}${ext}`;
    const thumbnailPath = path.join(__dirname, 'public', 'lovable-uploads', 'thumbnails', thumbnailFilename);
    
    // Crear directorio de thumbnails si no existe
    const thumbDir = path.join(__dirname, 'public', 'lovable-uploads', 'thumbnails');
    if (!fs.existsSync(thumbDir)) {
      fs.mkdirSync(thumbDir, { recursive: true });
    }
    
    // Generar thumbnail
    await sharp(originalPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const thumbnailUrl = `${baseUrl}/lovable-uploads/thumbnails/${thumbnailFilename}`;
    
    res.json({
      success: true,
      thumbnail_url: thumbnailUrl,
      message: 'Thumbnail generado exitosamente'
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({ error: 'Error al generar thumbnail' });
  }
});

// Endpoint para analizar imagen (solo si se solicita explícitamente)
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'No se proporcionó el nombre del archivo' });
    }
    
    const imagePath = path.join(__dirname, 'public', 'lovable-uploads', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Obtener metadata de la imagen sin modificarla
    const metadata = await sharp(imagePath).metadata();
    
    // Análisis básico de la imagen
    const analysis = {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels,
      space: metadata.space,
      isProgressive: metadata.isProgressive,
      // Se pueden agregar más análisis aquí si el usuario lo solicita:
      // - Detección de texto (OCR) con tesseract.js
      // - Detección de objetos/etiquetas con API de visión
      // - Análisis de colores dominantes
      // - etc.
    };
    
    res.json({
      success: true,
      analysis: analysis,
      message: 'Imagen analizada exitosamente sin modificaciones'
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Error al analizar imagen' });
  }
});

// Servir archivos estáticos
app.use('/lovable-uploads', express.static(path.join(__dirname, 'public', 'lovable-uploads')));

// Endpoint para listar imágenes
app.get('/api/images', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');
    
    if (!fs.existsSync(uploadDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadDir);
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).map(file => ({
      filename: file,
      path: `/lovable-uploads/${file}`,
      original_url: `${baseUrl}/lovable-uploads/${file}`,
      size: fs.statSync(path.join(uploadDir, file)).size
    }));

    res.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Error al listar imágenes' });
  }
});

// Endpoint para obtener la última imagen subida (por mtime)
app.get('/api/images/latest', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');

    if (!fs.existsSync(uploadDir)) {
      return res.json({ image: null });
    }

    const files = fs.readdirSync(uploadDir)
      .filter(file => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file).toLowerCase()))
      .map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        return { file, mtime: stats.mtimeMs, size: stats.size };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      return res.json({ image: null });
    }

    const latest = files[0];
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    
    return res.json({
      image: {
        filename: latest.file,
        path: `/lovable-uploads/${latest.file}`,
        original_url: `${baseUrl}/lovable-uploads/${latest.file}`,
        size: latest.size
      }
    });
  } catch (error) {
    console.error('Error obtaining latest image:', error);
    res.status(500).json({ error: 'Error al obtener la última imagen' });
  }
});

// Endpoint para eliminar imagen
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadDir = path.join(__dirname, 'public', 'lovable-uploads');
    const filePath = path.join(uploadDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Verificar que es una imagen
    const ext = path.extname(filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return res.status(400).json({ error: 'Solo se pueden eliminar archivos de imagen' });
    }

    // Eliminar el archivo
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de uploads corriendo en http://localhost:${PORT}`);
  console.log(`📁 Directorio de uploads: ${path.join(__dirname, 'public', 'lovable-uploads')}`);
}); 