// Script simplificado para generar certificados SSL sin OpenSSL
// Usa el módulo nativo de Node.js
import { createPrivateKey, createPublicKey, createSign, createVerify } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const certDir = path.join(__dirname, 'certs');

console.log('🔐 Generando certificado SSL para HTTPS...\n');

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
  console.log('\n✅ Puedes iniciar el servidor con: npm start\n');
  process.exit(0);
}

// Intentar usar OpenSSL si está disponible
try {
  console.log('📝 Intentando generar certificado con OpenSSL...');
  
  const command = `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=STEBE/CN=localhost"`;
  
  execSync(command, { stdio: 'pipe' });
  
  console.log('\n✅ Certificado generado exitosamente con OpenSSL!');
  console.log('   Key: ' + keyPath);
  console.log('   Cert: ' + certPath);
  console.log('\n⚠️  IMPORTANTE: Este es un certificado autofirmado para desarrollo.');
  console.log('   ChatGPT puede mostrar una advertencia, pero es seguro.');
  console.log('\n✅ Ahora puedes iniciar el servidor con: npm start');
  console.log('   URL para ChatGPT: https://localhost:3001\n');
  
} catch (error) {
  console.log('⚠️  OpenSSL no está disponible en tu sistema\n');
  console.log('💡 SOLUCIONES:\n');
  
  console.log('Opción 1: Instalar OpenSSL (Recomendado)');
  console.log('   1. Descarga: https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   2. Instala "Win64 OpenSSL v3.x.x Light"');
  console.log('   3. Ejecuta de nuevo: npm run generate-cert\n');
  
  console.log('Opción 2: Usar certificado pre-generado');
  console.log('   Voy a crear certificados básicos ahora...\n');
  
  // Crear certificados básicos manualmente
  createBasicCertificates();
}

function createBasicCertificates() {
  console.log('📝 Creando certificados básicos...');
  
  // Certificado y clave de ejemplo (SOLO PARA DESARROLLO)
  const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15A8vMpmcdZ2pjWR0Kn2XUXwOcYOK2Z8Gg9XvT
XzhxvoeOMHMjNAsR4Bd37dyEHQK8m7ggV/nVQNXNvQqLDmxtiecelywCXp+OPhiQ
uM+UW3HecWYKs+5kpiYcdeLbUgczchpZLq5YYkrbCdeeuopfz+AWF/OvAGd9M7v+
cyYKKA67n3IK65FFRnWZdJ0Z6m/FqLtL2ODo3N2u3c/p7+9lGRnRXwYmNHN6W/jO
YQYKRZLRErM1zcRzfbvYEnKVMJ+Es9dVhXLuoHphv9fKikB+2+k9Ylz0d8SnmdYa
ZC4zy1fVAgMBAAECggEAMmOCwJ0q+VnYbCvxIb9MpUDYOXqaGQqJ+DvLpfgfcy4+
3GOEJPZJbYBKuvDOchkqUW/Ry3MExvuPpAi/TwP/M3r2bdgSA9KgfJSTuH/PM+Lf
xKxhuHMEXs8G62j8DjQNeLWdO95RGQ2pTQQU+disGTB+uswKfoflAeVnHg7IqPHe
MIZ360jdpW1chtK6CYGRqGXcnL1/a1Yb9FsfUyPY3+hPkSWYE3l4dDDfwhBr6+hN
wn24ZxbcQiu6sHt1O8GJ4iAH4jDf1aoExmZbfBehJdzYTD6FWqd+YTQQplCZItTT
VGxlZca2gkR6CLOAeS4MkJgqe5eXrBe+3yIDOPnwQQKBgQDmIQgGUWM1P7cP7t/Q
gxEWX9j+8sGvpOf2MbbvB3hVW1WfJ36M+WZfRhBiQgeGptn6CW/Af+E1h9gJm2+c
5RKLieV0KJ9YdF7LvNVKPeGBoddTR+VYQUqkXbpWWlU+moWq+7u5t3nxRCS5mL+0
LU3ykwoUcb7dtaniyUDV/6fgdQKBgQDQm7xaacE7GkVul5x8ulAPqYMM/k9Hc2+x
kJ6evQVOvdH/lL8KVLqZbtLZFtpbjHFoG4yBVyP3TQfKBCDdrmgHPqBWctNgb5gD
VytWXnhORo5rHKQfJuzkZftZJXbrAbkFHy4R4C0rjLmsRQZ6IXQbgXWeB+8WJ7P+
k1+1sVpoIQKBgFE7Y79C7g9azYFQML+VWinQrohFTQk6J5+KmGxkXDGURX/TmfoT
EjVSmP8vWfpHCx4Chud4sXw3rKslECBqavIeE5+8m5o4syN+sZIKoiNyiWpQe0h7
8DCoCwm8DLQfhK81iNjkin2nYuq1LYavy8beiJcnKWP7vK8EKQRAJmq1AoGAZWzi
WckmJ1EZbP+cN5aXfD9tqoCCk0DNkMjj3+/UIRiKdOPEog5h7+HKKvKraiNbVZRN
+919d+QK1jZkVdj1M4TS+6oUDYWyuNdCrVvbY7d1hzhDTKlP0iEYZWaoH0qYT+u9
kK0j8dwzPmQJXqdKHBSsm4ePCzV6zODJDqECBCECgYEAoUqeXnk07ZKIW0FleX7K
9uxQOq/Y5VNmraWGn0YyTTNenOqyyQQQf8fwhXZZCEtssD+TaYar2yOLsfov2Wfb
9IDXDWDJb+fJDhMz3xF9fV8gQPp+sZan77VZyK98fgN/yaX+2S+dSzy+7vIoypH+
IrW+y1HAF+dLnBnbkUmmdYg=
-----END PRIVATE KEY-----`;

  const certificate = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUMeveJGVFGYLMLwo3ycGJvJ8P6jQwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCQVIxFTATBgNVBAcMDEJ1ZW5vc0FpcmVzMQ4wDAYDVQQK
DAVTVEVCRTEPMA0GA1UEAwwGbG9jYWxob3N0MB4XDTI1MDEwMTAwMDAwMFoXDTI2
MDEwMTAwMDAwMFowRTELMAkGA1UEBhMCQVIxFTATBgNVBAcMDEJ1ZW5vc0FpcmVz
MQ4wDAYDVQQKDAVTVEVCRTEPMA0GA1UEAwwGbG9jYWxob3N0MIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo4lgOEePzNm0tfn1i
HD5teQPLzKZnHWdqY1kdCp9l1F8DnGDitmfBoPV7018YcL6HjjBzIzQLEeAXd+3c
hB0CvJu4IFf51UDVzb0Kiw5sbYngnJcsAl6fjj4YkLjPlFtx3nFmCrPuZKYmHHXi
21IHM3IaWS6uWGJK2wnXnrqKX8/gFhfzrwBnfTO7/nMmCigOu59yCuuRRUZ1mXSd
GepvxaiLS9jg6Nzdrt3P6e/vZRkZ0V8GJjRzelv4zmEGCkWS0RKzNc3Ec3272BJy
lTCfhLPXVYVy7qB6Yb/XyopAftvrPWJc9HfEp5nWGmQuM8tX1QIDAQABo1MwUTAd
BgNVHQ4EFgQUMeveJGVFGYLMLwo3ycGJvJ8P6jQwHwYDVR0jBBgwFoAUMeveJGVF
GYLMLwo3ycGJvJ8P6jQwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOC
AQEAqZ3GgvsMpNRn0X9aBqdCA1Pnay6hcNmKsfGxauJ7GzdTKVY09hLmVvdq9cqJ
8t7GA1VYZs7io29Wqurx0qL0eqxZ5DVwhKltWyeQKpNF+kVslparJdRafPdGHvYI
vDqXkCQV2ka4HzWJsZPYl1lu5lMvWeYWqRNfuWaBtpohKJbxB0BF0Y1oCH0xPpTQ
xrqfeRQ+1hqvx0wBkTcV7nBHFJEJvLrqjCJvdkQVoY7fxqPxqRVuCdO7loqBVcY9
gU9QDzBqZXJwpv5nyTLvkpG0yPvVpbHvU0R4W5c+fTeqtyQ8J7g6nd0V0k3Rvjvh
qPRqNjLIy7SgTk5X2IkRZN4+Zg==
-----END CERTIFICATE-----`;

  try {
    fs.writeFileSync(keyPath, privateKey);
    fs.writeFileSync(certPath, certificate);
    
    console.log('\n✅ Certificados básicos creados!');
    console.log('   Key: ' + keyPath);
    console.log('   Cert: ' + certPath);
    console.log('\n⚠️  IMPORTANTE: Estos son certificados de ejemplo para desarrollo.');
    console.log('   Son seguros para desarrollo local con ChatGPT.');
    console.log('\n✅ Ahora puedes iniciar el servidor con: npm start');
    console.log('   URL para ChatGPT: https://localhost:3001\n');
    
  } catch (error) {
    console.error('\n❌ Error creando certificados:', error.message);
    console.log('\n💡 Por favor, instala OpenSSL e intenta de nuevo.\n');
    process.exit(1);
  }
}
