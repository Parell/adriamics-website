import {insert} from '@mathjax/src/js/util/Options.js';

const GLOBAL = typeof window === 'undefined' ? global : window;

GLOBAL.MathJax = insert({
  tex: {
    packages: ['base', 'ams'],
    macros: {}
  }
}, GLOBAL.MathJax || {}, false);
