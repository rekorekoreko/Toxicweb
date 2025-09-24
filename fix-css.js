const fs = require('fs');
const path = 'src/main.css';
let text = fs.readFileSync(path, 'utf8');
const placeholder = '__CRLF__';
text = text.replace(/\r\n/g, placeholder);
text = text.replace(/\n/g, 'n');
text = text.replace(new RegExp(placeholder, 'g'), '\r\n');
fs.writeFileSync(path, text, 'utf8');
