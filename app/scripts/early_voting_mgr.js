define(
  [
    'jquery', 'moment', 'ejs',
    'map_service',
    'json!vendor/EARLY_VOTING_AddressPoints.geojson',
    'text!templates/early_voting_sidebar.ejs', 'scrollTo', 'moment_range', 'bootstrapCollapse'
  ],
  function ($, moment, ejs, mapService, earlyVotingJSON, earlyVotingSidebarTmpl) {
    'use strict';

    var earlyVotingLocations = mapService.earlyPollsDataLayer.addGeoJson(earlyVotingJSON);

    var renderers = [];

    var $el = $('#early-voting');
    var userAddress = '';

    var $address = $('#early-voting-address');

    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(42.360129, -71.148834),
      new google.maps.LatLng(42.389868, -71.075535)
    );
    var autocomplete = new google.maps.places.Autocomplete($address.get(0), {
      bounds: defaultBounds
    });

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
            var cardBody = $('#collapse' + i);
            if (cardBody.hasClass('in')) {
              cardBody.removeClass('in');
            } else {
              cardBody.addClass('in');
            }

            $el.scrollTo($('#location' + i), 800);
          }
        }
      }
    }

    function listenToSidebarEvents() {
      var sidebarDivs = $("#early-voting-sidebar").children();

      sidebarDivs.each(function (i, sb) {
        $(sb).click(function () {
          var panel = $(this).closest('.early-voting-location').find('.early-voting-directions');
          toggleDirections(userAddress, panel);
        });

        $(sb).mouseover(function () {
          mapService.changeMarkerColor(i, "hover");
        });

        $(sb).mouseout(function () {
          mapService.changeMarkerColor(i, "default");
        });
      });

    }

    function toggleDirections(address, panel) {
      var isExpanded = panel.closest('.panel-collapse').hasClass('in');
      if (isExpanded) {
        clearDirections(panel);
      } else {
        showDirections(address, panel);
      }
    }

    function clearDirections(panel) {
      var index = panel.data('location');
      mapService.clearDirectionsRenderer(renderers[index]);
      panel.empty();
    }

    function showDirections(address, panel) {
      var index = panel.data('location');
      var destination = earlyVotingLocations[index].getGeometry().get();
      mapService.searchAddress(address, function (results) {
        mapService.displaySearchResults(results, panel, function (result) {
          mapService.displayDirections(result, destination, renderers[index]);
        });
      }, function () {
        alert("Could not find the address");
      });
    }

    function updatePollingDirections(address) {
      $('.early-voting-directions').each(function () {
        var panel = $(this);
        var isExpanded = panel.closest('.panel-collapse').hasClass('in');
        if (isExpanded) {
          clearDirections(panel);
          showDirections(address, panel);
        }
      });
    }

    return {
      init: function () {
        $el.find('#early-voting-sidebar').html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: earlyVotingLocations,
          getDirections: getDirections
        }));

        $('.early-voting-location-details .tab-header a', $el).click(function () {
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

        renderers = $.map(earlyVotingLocations, function (location, index) {
          var panel = $('.early-voting-directions, [data-location=' + index + ']');
          return mapService.getDirectionsRenderer(panel[0]);
        });

        $address.siblings('button').click(function () {
          userAddress = $address.val();
          updatePollingDirections(userAddress);
        });
      }
    }
  }
);
