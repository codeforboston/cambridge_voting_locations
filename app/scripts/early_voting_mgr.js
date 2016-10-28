define(
  [
    'jquery', 'moment', 'ejs',
    'map_service',
    'json!vendor/EARLY_VOTING_AddressPoints.geojson',
    'text!templates/early_voting_sidebar.ejs', 'scrollTo', 'moment_range', 'bootstrapCollapse'
  ],
  function($, moment, ejs, mapService, earlyVotingJSON, earlyVotingSidebarTmpl) {
    'use strict';

    var earlyVotingLocations = mapService.earlyPollsDataLayer.addGeoJson(earlyVotingJSON);

    var $el = $('#early-voting');

    var userAddress = '145 Broadway';

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
          if (marker.getPosition().equals(earlyVotingLocations[i].getGeometry().get())) {
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

    function updatePollingDirections(address) {
      $('.early-voting-directions').each(function() {
        var panel = $(this); // Google geocoder does not like jQuery objects
        var destination = earlyVotingLocations[panel.data('location')].getGeometry().get();
        panel.empty();
        mapService.searchAddress(address, function(results) {
          mapService.displaySearchResults(results, panel, function (result) {
            mapService.displayDirections(result, destination, panel[0]);
          });
        }, function() {
          alert("Sorry duuuuude");
        });
      });
    }

    return {
      init: function() {
        $el.find('#early-voting-sidebar').html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: earlyVotingLocations,
          getDirections: getDirections
        }));

        $('.early-voting-location-details .tab-header a', $el).click(function() {
          var tab = $(this).closest('li');
          tab.addClass('active');
          tab.siblings('li').removeClass('active');
          var content = $(this).attr('href');
          var container = $(this).closest('.early-voting-location-details');
          $('.tab-contents', container).hide();
          $('.tab-contents.' + content, container).show();
          return false;
        });

        listenToSidebarEvents();
        mapService.subscribeToMarkerEvents(whenMarkerEventsHappen);

        updatePollingDirections(userAddress);
      }
    }
  }
);
