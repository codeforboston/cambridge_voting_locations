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
    var userAddressLatlng = '';

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
            var panel = cardBody.find('.early-voting-directions');
            toggleDirections(userAddressLatlng, panel);

            cardBody.collapse('toggle');
            $el.scrollTo($('#location' + i), 800);
          }
        }
      }
    }

    function listenToSidebarEvents() {
      var sidebarDivs = $("#early-voting-sidebar").children();

      sidebarDivs.each(function (i, sb) {
        $(sb).click(function () {
          var container = $(this).closest('.early-voting-location');
          var panel = container.find('.early-voting-directions');
          toggleDirections(userAddressLatlng, panel);
        });

        $(sb).mouseover(function () {
          mapService.changeMarkerColor(i, "hover");
        });

        $(sb).mouseout(function () {
          mapService.changeMarkerColor(i, "default");
        });
      });

    }

    function toggleDirections(latlng, panel) {
      var isExpanded = panel.closest('.panel-collapse').hasClass('in');
      if (isExpanded) {
        clearDirections(panel);
      } else {
        showDirections(latlng, panel);
      }
    }

    function clearDirections(panel) {
      var index = panel.data('location');
      mapService.clearDirectionsRenderer(renderers[index]);
      panel.empty();
    }

    function showDirections(latlng, panel) {
      var index = panel.data('location');
      var destination = earlyVotingLocations[index].getGeometry().get();
      panel.empty();
      mapService.displayDirections(latlng, destination, renderers[index]);
    }

    function updatePollingDirections(latlng) {
      $('.early-voting-directions').each(function () {
        var panel = $(this);
        var isExpanded = panel.closest('.panel-collapse').hasClass('in');
        if (isExpanded) {
          clearDirections(panel);
          showDirections(latlng, panel);
        }
      });
    }

    function setActiveTab(panel) {
      var tab = panel.closest('li');
      tab.addClass('active');
      tab.siblings('li').removeClass('active');
      var content = panel.attr('href');
      var container = panel.closest('.early-voting-location-details');
      $('.tab-contents', container).hide();
      $('.tab-contents.' + content, container).show();
    }

    return {
      clearDirections: function() {
        $.each(renderers, function(index, renderer) {
          mapService.clearDirectionsRenderer(renderer);
        });
      },

      init: function () {
        $el.find('#early-voting-sidebar').html(ejs.render(earlyVotingSidebarTmpl, {
          moment: moment,
          locations: earlyVotingLocations,
          getDirections: getDirections
        }));

        $('.early-voting-location-details .tab-header a', $el).click(function () {
          setActiveTab($(this));
          return false;
        });

        listenToSidebarEvents();

        mapService.subscribeToMarkerEvents(whenMarkerEventsHappen);

        renderers = $.map(earlyVotingLocations, function (location, index) {
          var panel = $('.early-voting-directions[data-location=' + index + ']');
          return mapService.getDirectionsRenderer(panel[0]);
        });

        $('.tab-contents.directions').hide();

        $address.siblings('button').click(function () {
          var address = $address.val();
          updatePollingDirections(address);
          mapService.searchAddress(address, function (results) {
            userAddressLatlng = results[0].geometry.location;
            mapService.updateUserAddressMarker(userAddressLatlng);
          })
        });
      }
    }
  }
);
