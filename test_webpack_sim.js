// Simulate what webpack bundle does
// 1. Webpack requires opal-runtime first (sets global.Opal)
const Opal = require('@asciidoctor/opal-runtime');
console.log('opal-runtime loaded, global.Opal === Opal:', global.Opal === Opal);

// 2. Webpack requires asciidoctor/core which also requires opal-runtime (gets cache hit)
const asciidoctor = require('@asciidoctor/core/dist/node/asciidoctor.cjs')();
console.log('asciidoctor/core loaded, global.Opal.Asciidoctor:', !!global.Opal.Asciidoctor);

// 3. Webpack requires reveal.js - the outer wrapper runs with global.Opal
// The reveal.js outer wrapper: (function(Opal) { ... })(Opal)
// In webpack, Opal refers to global.Opal
console.log('global.Opal.add_stubs:', typeof global.Opal.add_stubs);

// Test: does calling add_stubs with array crash?  
try {
  global.Opal.add_stubs(['$==', '$require']);
  console.log('Array add_stubs WORKED - this is unexpected!');
} catch(e) {
  console.log('Array add_stubs crashed (expected):', e.message);
}
