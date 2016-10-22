define(['geojson',
        'json!vendor/EARLY_VOTING_AddressPoints.geojson'],
        function(GeoJSON,  earlyPollingJSON) {


  var hoverIcon = "https://mts.googleapis.com/maps/vt/icon/name=icons/spotlight/spotlight-waypoint-a.png&text=•&psize=30&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1"
  var defaultIcon = "https://mts.googleapis.com/maps/vt/icon/name=icons/spotlight/spotlight-waypoint-b.png&text=•&psize=30&font=fonts/Roboto-Regular.ttf&color=ff333333&ax=44&ay=48&scale=1"


  var DEFAULT_ZOOM_LEVEL = 13;
  var DEFAULT_CENTER_POSITION = new google.maps.LatLng(42.3736, -71.1106); // Cambridge


  var earlyPollingLocations = new GeoJSON(earlyPollingJSON);


  var map = new google.maps.Map(document.getElementById('map'), {
    center: DEFAULT_CENTER_POSITION,
    zoom: DEFAULT_ZOOM_LEVEL
  });


  var directionsService = new google.maps.DirectionsService(),
      directionsDisplay = new google.maps.DirectionsRenderer({
          map: map,
          preserveViewport: true,
          panel: document.getElementById('directions')
      });

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

  function fireMarkerEvent(eventType, marker) {
    markerEventListeners.forEach(function(cb) {
      cb(eventType, marker);
    });
  }

  function createEarlyPollingMarkers() {
    earlyPollingLocations.forEach(function(location) {
      var earlyVotingMarker = new google.maps.Marker({
        position: location.position
      });
      earlyVotingMarker.addListener('click', function() {
        fireMarkerEvent('click', earlyVotingMarker);
      });

      earlyPollingMarkers.push(earlyVotingMarker);
    });
  }

  function clearEarlyMarkers () {
    earlyPollingMarkers.forEach(function(marker) {
      marker.setMap(null);
    });
  }

  function clearPollingLocation() {
    if (userInputs.precinct) {
      userInputs.precinct.setMap(null);
    }
    directionsDisplay.setDirections({routes: []});

    // TODO move UI interaction into its own module
    $('.result').removeClass('success');
    $('#notice').removeClass('error').empty();
    $('#info .location, #info .notes').empty();
    $('#directions-link').removeAttr('href');
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

  function displayDirections(latLng, destination, successCallback, errorCallback) {
    var request = {
      origin: latLng,
      destination: destination,
      travelMode: google.maps.TravelMode.WALKING
    };
    directionsService.route(request, function(result, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
        if(successCallback) {
          successCallback({result: result, status: status});
        }
      } else {
        if(errorCallback) {
          errorCallback({result: result, status: status});
        }
      }
    });

    $('#directions-link').attr('href', getDirections(destination));
  }



  return {

    displayEarlyPollingMarkers: function() {

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


    changeMarkerColor:function(index, color) {
      if (color === "hover") {
        earlyPollingMarkers[index].setIcon(hoverIcon);
      } else if (color === "default") {
        earlyPollingMarkers[index].setIcon(defaultIcon);
      }
    },

      // Display previous user polling place
    displayUserPollingPlace: function() {

      clearEarlyMarkers();

      if (userInputs.precinct && userInputs.homeAddress && userInputs.destination) {
        userInputs.precinct.setMap(map);
        map.fitBounds(userInputs.precinct.getBounds());
        displayDirections(userInputs.homeAddress, userInputs.destination);
      }
    },

    subscribeToMarkerEvents: function(cb) {
      markerEventListeners.push(cb);
    },

    displayNewPollingPlace: function(latLng, destination, precinct, successCallback, errorCallback) {

      clearEarlyMarkers();
      clearPollingLocation();
      clearUserInputs();

      userInputs.precinct = precinct;
      userInputs.homeAddress = latLng;
      userInputs.destination = destination;


      userInputs.precinct.setMap(map);
      map.fitBounds(userInputs.precinct.getBounds());

      displayDirections(latLng, destination, successCallback, errorCallback);

    },
  };
});
