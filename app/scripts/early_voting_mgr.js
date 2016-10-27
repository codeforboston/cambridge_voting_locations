define(
  [
    'jquery', 'moment', 'ejs',
    'map_service',
    'text!templates/early_voting_sidebar.ejs', 'scrollTo', 'moment_range', 'bootstrapCollapse'
  ],
  function($, moment, ejs, mapService, earlyVotingSidebarTmpl) {
    'use strict';
	  
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
        for (var i = 0; i < mapService.earlyPollingLocations.length; i++) {
			var currentEarlyPoll = mapService.earlyPollingLocations[i].getGeometry().get();
          if (marker.getPosition().equals(currentEarlyPoll)) {
            $el.scrollTo($('#location'+i), 800);
          }
        } 
      }
    }

    function listenToSidebarEvents() {
      var sidebarDivs = $("#early-voting-sidebar").children();

       sidebarDivs.each(function(i,sb) {
          $(sb).mouseover(function() {
            mapService.changeMarkerColor(i, "hover");
          });

          $(sb).mouseout(function() {
            mapService.changeMarkerColor(i, "default");
          });
       });

    }

    return {
      init: function() {
        $el.find('#early-voting-sidebar').html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: mapService.earlyPollingLocations,
          getDirections: getDirections
        }));

        listenToSidebarEvents();
        mapService.subscribeToMarkerEvents(whenMarkerEventsHappen);
      }
    }
  }
);
