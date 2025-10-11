// Script para generar certificado SSL autofirmado
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certDir = path.join(__dirname, 'certs');

console.log('🔐 Generando certificado SSL autofirmado...\n');

// Crear directorio de certificados si no existe
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
  console.log('✅ Directorio de certificados creado');
}

const keyPath = path.join(certDir, 'key.pem');
const certPath = path.join(certDir, 'cert.pem');

// Verificar si ya existen los certificados
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('ℹ️  Los certificados ya existen');
  console.log('   Key: ' + keyPath);
  console.log('   Cert: ' + certPath);
  process.exit(0);
}

try {
  // Generar certificado autofirmado usando OpenSSL
  console.log('📝 Generando certificado con OpenSSL...');
  
  const command = `openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=STEBE/CN=localhost"`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✅ Certificado generado exitosamente!');
  console.log('   Key: ' + keyPath);
  console.log('   Cert: ' + certPath);
  console.log('\n⚠️  IMPORTANTE: Este es un certificado autofirmado para desarrollo.');
  console.log('   Tu navegador mostrará una advertencia de seguridad.');
  console.log('   Esto es normal y seguro para desarrollo local.\n');
  
} catch (error) {
  console.error('\n❌ Error generando certificado:', error.message);
  console.log('\n💡 Solución alternativa:');
  console.log('   1. Instala OpenSSL: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. O usa el servidor HTTP (menos seguro pero funciona)');
  console.log('   3. O crea los certificados manualmente\n');
  process.exit(1);
}
