define(
  [
    'jquery', 'moment', 'ejs', 'geojson',
    'map_service',
    'json!vendor/EARLY_VOTING_AddressPoints.geojson',
    'text!templates/early_voting_sidebar.ejs', 'moment_range'
  ],
  function($, moment, ejs, GeoJSON, mapService, earlyVotingJSON, earlyVotingSidebarTmpl) {
    'use strict';

    var earlyVotingLocations = new GeoJSON(earlyVotingJSON);

    var $el = $('#early-voting-sidebar');

    function getDirections(destination) {
      var url;
      if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
        url = "http://maps.apple.com/?saddr=Current+Location&daddr=";
      } else {
        url = "https://maps.google.com/maps?daddr=";
      }
      return encodeURI(url + destination);
    }

    function whenMarkerEventsHappen(eventType, marker) {
    }

    return {
      init: function() {
        $el.html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: earlyVotingLocations,
          getDirections: getDirections
        }));

        mapService.subscribeToMarkerEvents(whenMarkerEventsHappen);
      }
    }
  }
);
