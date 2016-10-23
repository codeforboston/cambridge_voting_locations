define(
  [
    'jquery', 'moment', 'ejs', 'geojson',
    'map_service',
    'json!vendor/EARLY_VOTING_AddressPoints.geojson',
    'text!templates/early_voting_sidebar.ejs', 'scrollTo', 'moment_range', 'bootstrapCollapse'
  ],
  function($, moment, ejs, GeoJSON, mapService, earlyVotingJSON, earlyVotingSidebarTmpl) {
    'use strict';

    var earlyVotingLocations = new GeoJSON(earlyVotingJSON);

    var $el = $('#early-voting');

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
      if (eventType === 'click') {
        for (var i = 0; i < earlyVotingLocations.length; i++) {
          if (marker.getPosition().equals(earlyVotingLocations[i].getPosition())) {
            $el.scrollTo($('#location'+i), 800);
          }
        }
      }
    }

    return {
      init: function() {
        $el.find('#early-voting-sidebar').html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: earlyVotingLocations,
          getDirections: getDirections,
          earlyPollingMarkers: mapService.getEarlyPollingMarkers()
        }));

        mapService.subscribeToMarkerEvents(whenMarkerEventsHappen);
      }
    }
  }
);
