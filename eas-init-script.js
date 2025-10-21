const { spawn } = require('child_process');

const easInit = spawn('eas', ['init'], {
  stdio: 'pipe'
});

easInit.stdin.write('bbtricksz\n'); // Seleccionar cuenta bbtricksz
easInit.stdin.write('steeb-native\n'); // Confirmar slug
easInit.stdin.end();

easInit.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

easInit.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

easInit.on('close', (code) => {
  console.log(`Process exited with code: ${code}`);
});