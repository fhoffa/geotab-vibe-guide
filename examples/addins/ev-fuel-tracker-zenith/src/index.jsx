// Part of Geotab Vibe Guide: https://github.com/fhoffa/geotab-vibe-guide
import React from 'react';
import ReactDOM from 'react-dom/client';
import EvFuelTracker from './EvFuelTracker';
import '@geotab/zenith/dist/index.css';

geotab.addin['ev-fuel-tracker-zenith'] = function () {
  let root = null;

  return {
    initialize: function (api, state, callback) {
      callback();
    },

    focus: function (api, state) {
      const container = document.getElementById('evFuelTrackerRoot');
      if (container) {
        root = ReactDOM.createRoot(container);
        root.render(<EvFuelTracker api={api} />);
      }
    },

    blur: function (api, state) {
      if (root) {
        root.unmount();
        root = null;
      }
    }
  };
};
