const http = require('http');

http.get('http://localhost:3001/uploads/lectures/6a100ecefd6dfccb9c163dba/audio.webm', (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  process.exit(0);
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
  process.exit(1);
});
