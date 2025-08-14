const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Configurar CORS
app.use(cors());

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
    const imagePath = `/lovable-uploads/${filename}`;

    res.json({
      success: true,
      filename: filename,
      path: imagePath,
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).map(file => ({
      filename: file,
      path: `/lovable-uploads/${file}`,
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
    return res.json({
      image: {
        filename: latest.file,
        path: `/lovable-uploads/${latest.file}`,
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