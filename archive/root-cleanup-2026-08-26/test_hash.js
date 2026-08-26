const b = require('bcryptjs');
const hash = '$2a$10$2calrbHebt9dZV0FxmA3xe/3jBvA2zvanQ9I8rwecwcjT5Iu7RxU.';
console.log('compare 123456:', b.compareSync('123456', hash));
