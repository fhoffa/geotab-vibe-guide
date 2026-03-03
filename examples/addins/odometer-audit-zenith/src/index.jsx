// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React from 'react';
import ReactDOM from 'react-dom/client';
import OdometerAudit from './OdometerAudit';

// MyGeotab Add-In entry point
geotab.addin['audit'] = function() {
  let root = null;

  return {
    initialize: function(api, state, callback) {
      callback();
    },

    focus: function(api, state) {
      const container = document.getElementById('odometerAuditRoot');
      if (container) {
        root = ReactDOM.createRoot(container);
        root.render(<OdometerAudit api={api} />);
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
