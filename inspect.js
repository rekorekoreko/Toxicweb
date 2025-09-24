const fs = require('fs');
const text = fs.readFileSync('App.tsx','utf8');
const start = text.indexOf('function handleQuizSelect');
console.log(text.slice(start, start+80));
