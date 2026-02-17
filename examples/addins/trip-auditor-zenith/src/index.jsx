// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React from 'react';
import ReactDOM from 'react-dom/client';
import TripAuditor from './TripAuditor';
import '@geotab/zenith/dist/index.css';

// MyGeotab Add-In entry point
geotab.addin.tripAuditorZenith = function() {
  let root = null;

  return {
    initialize: function(api, state, callback) {
      callback();
    },

    focus: function(api, state) {
      const container = document.getElementById('tripAuditorRoot');
      if (container) {
        root = ReactDOM.createRoot(container);
        root.render(<TripAuditor api={api} />);
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
