const { io } = require('socket.io-client');
const socket = io('http://localhost:5000', { transports: ['websocket'] });
socket.on('connect', () => {
  console.log('Connected with id:', socket.id);
  socket.emit('join:job', { job_id: 'job-123' });
  socket.emit('join:tenant', { tenant_id: 'tenant-123' });
});
socket.on('schema:ready', (data) => {
  console.log('Received schema:ready', data);
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.error('Connect Error:', err.message);
});
setTimeout(() => {
  console.log('Timeout');
  process.exit(0);
}, 5000);
