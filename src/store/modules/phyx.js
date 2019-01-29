/*
 * Primary store module for the currently loaded Phyx file. We also keep a copy
 * of the Phyx file as it was loaded, allowing modifications to be noted. This
 * module also stores and resets the reasoning results provided by the JPhyloRef
 * server.
 */

import Vue from 'vue';
import phylogeny from './phylogeny';
import phyloref from './phyloref';

export default {
  state: {
    currentPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
    loadedPhyx: {
      phylorefs: [],
      phylogenies: [],
    },
    reasoningResults: undefined,
  },
  getters: {
    // Read as JSON.
    getPhyxAsJSON: state => JSON.stringify(state.currentPhyx, undefined, 4),
  },
  mutations: {
    setCurrentPhyx(state, phyx) {
      // Replace the current Phyx file using an object. This method does NOT
      // update the loaded Phyx file, so these changes are treated as changes
      // made since the file was last loaded.
      Vue.set(state, 'currentPhyx', phyx);

      // When the current phyx is changed, reasoning results are invalidated,
      // so let's clear those.
      Vue.set(state, 'reasoningResults', undefined);
    },
    setLoadedPhyx(state, phyx) {
      // Replace the current loaded Phyx file using an object. This also updates
      // the loaded Phyx, so we can check for changes from the loaded file.
      //
      // This can be called without an argument to reset the loaded phyx to be
      // identical to the current Phyx.
      if (phyx === undefined || phyx === state.currentPhyx) {
        // A common error is using the same object as the current Phyx and the
        // loaded Phyx. In that case, we deep-copy loaded Phyx so that modifying
        // one won't automatically modify the other.
        Vue.set(state, 'loadedPhyx', JSON.parse(JSON.stringify(state.currentPhyx)));
      } else {
        Vue.set(state, 'loadedPhyx', phyx);
      }
    },
    createEmptyPhyloref(state) {
      state.currentPhyx.phylorefs.push({});
    },
    createEmptyPhylogeny(state) {
      state.currentPhyx.phylogenies.push({});
    },
    setReasoningResults(state, payload) {
      Vue.set(state, 'reasoningResults', payload);
    },
  },
  modules: {
    phylogeny,
    phyloref,
  },
};