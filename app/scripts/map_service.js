define(['json!vendor/EARLY_VOTING_AddressPoints.geojson'],
  function (earlyPollingJSON) {

    var hoverIcon = "https://mts.googleapis.com/maps/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&text=•&psize=30&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1"
    var defaultIcon = "https://mts.googleapis.com/maps/vt/icon/name=icons/spotlight/spotlight-waypoint-b.png&text=•&psize=30&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1"


    var DEFAULT_ZOOM_LEVEL = 13;
    var DEFAULT_CENTER_POSITION = new google.maps.LatLng(42.3736, -71.1106); // Cambridge

    var map = new google.maps.Map(document.getElementById('map'), {
      center: DEFAULT_CENTER_POSITION,
      zoom: DEFAULT_ZOOM_LEVEL
    });

    var earlyPollsDataLayer = new google.maps.Data(),
      precinctsDataLayer = new google.maps.Data(),
      electionPollsDataLayer = new google.maps.Data(),
      earlyPollingLocations = earlyPollsDataLayer.addGeoJson(earlyPollingJSON);

    var directionsService = new google.maps.DirectionsService();

    var markerEventListeners = [];

    var userInputs = {
      "precinct": null,
      "homeAddress": null,
      "destination": null
    }


    var earlyPollingMarkers = [];


    function clearUserInputs() {

      userInputs.precinct = null;
      userInputs.homeAddress = null;
      userInputs.destination = null;

    }

    function getDirectionsRenderer(panel) {
      return new google.maps.DirectionsRenderer({
        map: map,
        preserveViewport: true,
        panel: panel
      });
    }

    function fireMarkerEvent(eventType, marker) {
      markerEventListeners.forEach(function (cb) {
        cb(eventType, marker);
      });
    }

    function createEarlyPollingMarkers() {
      earlyPollingLocations.forEach(function (poll, index) {
        var earlyVotingMarker = new google.maps.Marker({
          position: poll.getGeometry().get()
        });
        earlyVotingMarker.addListener('click', function () {
          fireMarkerEvent('click', earlyVotingMarker);
        });
        earlyPollingMarkers.push(earlyVotingMarker);
      });
    }

    function clearEarlyMarkers() {
      earlyPollingMarkers.forEach(function (marker) {
        marker.setMap(null);
      });
    }

    function clearPollingLocation() {
      if (userInputs.precinct) {

        userInputs.precinct.setMap(null)

      }

      clearDirectionsRenderer(document.getElementById('directions'));

      // TODO move UI interaction into its own module
      $('.navigation-result').removeClass('success');
      $('#notice').removeClass('error').empty();
      $('#info .location, #info .notes').empty();
      $('#directions-link').removeAttr('href');
    }

    function clearDirectionsRenderer(panel) {
      getDirectionsRenderer(panel).setDirections({routes: []});
    }

    function getDirections(destination) {
      var url;
      if (navigator.userAgent.match(/iPhone|iPad|iPod/)) {
        url = "http://maps.apple.com/?saddr=Current+Location&daddr=";
      } else {
        url = "https://maps.google.com/maps?daddr=";
      }
      return encodeURI(url + destination);
    }

    function displayDirections(latLng, destination, panel, successCallback, errorCallback) {
      var request = {
        origin: latLng,
        destination: destination,
        travelMode: google.maps.TravelMode.WALKING
      };
      directionsService.route(request, function (result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
          var directionsDisplay = getDirectionsRenderer(panel);
          directionsDisplay.setDirections(result);
          if (successCallback) {
            successCallback({result: result, status: status});
          }
        } else {
          if (errorCallback) {
            errorCallback({result: result, status: status});
          }
        }
      });

      $('#directions-link').attr('href', getDirections(destination));
    }

    // go right to the first result if there's only one, or display a list if there are multiples
    function displaySearchResults(results, panel, callback) {
      var addressClickHandler = function () {
        var location = $(this).data('location');
        panel.empty();
        callback(location);
      };
      if (results.length === 1) {
        callback(results[0].geometry.location);
      } else {
        var $ul = $('<ul>').addClass('location-choices').appendTo(panel);
        for (var i = 0; i < results.length; i++) {
          var result = results[i];
          var link = $('<a>').text(result.formatted_address).data('location', result.geometry.location).on('click', addressClickHandler);
          $('<li>').append(link).appendTo($ul);
        }
      }
    }

    function searchAddress(address, successCallback, errorCallback) {
      var geocoder = new google.maps.Geocoder();

      var addressIsCambridgeStreetAddress = function (address) {
        var zip_index = -1;

        var addr_components = address.address_components;
        for (var i = 0; i < addr_components.length; i++) {
          if (addr_components[i].types[0] == "postal_code") {
            zip_index = i;
          }
        }

        var zipCodeComponent = addr_components[zip_index],
          zipCode = zipCodeComponent && zipCodeComponent.short_name;

        var isInCambridge = ($.inArray(zipCode, ['02138', '02139', '02140', '02141', '02142', '02238'])) > -1,
          isStreetAddress = ($.inArray('street_address', address.types)) > -1;

        return isInCambridge && isStreetAddress;
      }

      geocoder.geocode({
        address: address,
        componentRestrictions: {
          administrativeArea: 'Massachusetts',
          country: 'US'
        }
      }, function (results) {
        results = $.grep(results, addressIsCambridgeStreetAddress);

        if (!results.length) {
          geocoder.geocode({address: address + ' Cambridge, MA'}, function (results) {
            results = $.grep(results, addressIsCambridgeStreetAddress);
            if (!results.length) {
              errorCallback();
            } else {
              successCallback(results);
            }
          });
          // if there are no results, try searching for Cambridge
        } else {
          successCallback(results);
        }
      });
    }

    function drawPrecinct(latLng, destination, precinct) {
      userInputs.precinct = precinct;
      userInputs.homeAddress = latLng;
      userInputs.destination = destination;

      userInputs.precinct.setMap(map);
      map.fitBounds(userInputs.precinct.getBounds());
    }

    return {

      searchAddress: searchAddress,

      displaySearchResults: displaySearchResults,

      displayDirections: displayDirections,

      displayEarlyPollingMarkers: function () {

        clearPollingLocation();

        map.setCenter(DEFAULT_CENTER_POSITION);
        map.setZoom(DEFAULT_ZOOM_LEVEL);

        //clearPollingLocation();
        if (earlyPollingMarkers.length <= 0) {
          createEarlyPollingMarkers();
        }

        for (var i = 0; i < earlyPollingMarkers.length; i++) {
          earlyPollingMarkers[i].setMap(map);
        }
      },


      changeMarkerColor: function (index, color) {
        if (color === "hover") {
          earlyPollingMarkers[index].setIcon(hoverIcon);
        } else if (color === "default") {
          earlyPollingMarkers[index].setIcon(defaultIcon);
        }
      },

      // Display previous user polling place
      displayUserPollingPlace: function () {

        clearEarlyMarkers();

        if (userInputs.precinct && userInputs.homeAddress && userInputs.destination) {
          var panel = document.getElementById('directions');

          userInputs.precinct.setMap(map);
          map.fitBounds(userInputs.precinct.getBounds());
          displayDirections(userInputs.homeAddress, userInputs.destination, panel);

        }

      },

      subscribeToMarkerEvents: function (cb) {
        markerEventListeners.push(cb);
      },

      displayNewPollingPlace: function (latLng, destination, precinct, successCallback, errorCallback) {

        var panel = document.getElementById('directions');
        clearEarlyMarkers();
        clearPollingLocation();
        clearUserInputs();

        drawPrecinct(latLng, destination, precinct);

        displayDirections(latLng, destination, panel, successCallback, errorCallback);

      },
      googleMap: map,
      precinctsDataLayer: precinctsDataLayer,
      earlyPollsDataLayer: earlyPollsDataLayer,
      electionPollsDataLayer: electionPollsDataLayer

    };
  });
