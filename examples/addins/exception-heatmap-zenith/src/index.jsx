// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React from 'react';
import ReactDOM from 'react-dom/client';
import ExceptionHeatmap from './ExceptionHeatmap';
import '@geotab/zenith/dist/index.css';

// MyGeotab Add-In entry point
geotab.addin.exceptionHeatmapZenith = function() {
  let root = null;

  return {
    initialize: function(api, state, callback) {
      callback();
    },

    focus: function(api, state) {
      const container = document.getElementById('exceptionHeatmapRoot');
      if (container) {
        root = ReactDOM.createRoot(container);
        root.render(<ExceptionHeatmap api={api} />);
      }
    },

    blur: function(api, state) {
      if (root) {
        root.unmount();
        root = null;
      }
    }
  };
};
