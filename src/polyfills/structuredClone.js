import structuredClone from '@ungap/structured-clone';

// Load before the app: DiceBear clones its style during module initialization.
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = structuredClone;
}

