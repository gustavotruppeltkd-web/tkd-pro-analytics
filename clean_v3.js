const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'js', 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the literal replacement character \ufffd ()
content = content.replace(/Advers\ufffdrio/g, 'Adversário');
content = content.replace(/n\ufffdo encontrado/g, 'não encontrado');
content = content.replace(/n\ufffdo/g, 'não');
content = content.replace(/A\ufffdo/g, 'Ação');
content = content.replace(/T\ufffdcnicas/g, 'Técnicas');
content = content.replace(/T\ufffdtica/g, 'Tática');
content = content.replace(/Varia\ufffd\ufffdo/g, 'Variação');
content = content.replace(/Precisi\ufffdo/g, 'Precisão'); // Maybe this?
content = content.replace(/Obedi\ufffdncia/g, 'Obediência');
content = content.replace(/informa\ufffd\ufffdes/g, 'informações'); // Multiple?
content = content.replace(/Avalia\ufffd\ufffdo/g, 'Avaliação');
content = content.replace(/T\ufffdcnica/g, 'Técnica');

// Fix the sums/params residue if any
content = content.replace(/params/g, 'params');
content = content.replace(/items/g, 'items');
content = content.replace(/sums/g, 'sums');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Final replacement completed.');
