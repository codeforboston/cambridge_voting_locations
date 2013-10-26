define(['underscore', 'json!ELECTIONS_WardsPrecincts.geojson', 'json!ELECTIONS_PollingLocations.geojson', 'geojson'], function(_, precinctsJSON, locationsJSON, GeoJSON) {
      'use strict';

  var precincts = new GeoJSON(precinctsJSON),
      pollingLocations = new GeoJSON(locationsJSON);

  var map = new google.maps.Map(document.getElementById("map"), {
    center: new google.maps.LatLng(42.3736, -71.1106), // Cambridge!
    zoom: 12
  });
  var directionsService = new google.maps.DirectionsService(),
      directionsDisplay = new google.maps.DirectionsRenderer({map: map, preserveViewport: true, panel: document.getElementById("directions")});


  return function(coords) {
    // find out which ward they're in using Point in Polygon
    // TODO handle what happens if they don't live in any precinct
    var userPrecinct = _(precincts).find(function (precinct) {
      return precinct.containsLatLng(coords);
    });
    userPrecinct.setMap(map);
    map.fitBounds(userPrecinct.getBounds());

    // find the polling place
    var pollingLocation = _(pollingLocations).find(function(location) {
      return location.geojsonProperties.W_P === userPrecinct.geojsonProperties.WardPrecinct;
    });

    // new google.maps.Marker({position: pollingLocation.position, map: map});
    // new google.maps.Marker({position: coords, map: map});

    // show them a map with their ward highlighted, with a marker for the polling place

    // show them step-by-step directions
    var request = {
      origin: coords,
      destination: pollingLocation.position,
      travelMode: google.maps.TravelMode.WALKING
    };
    directionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(result);
      }
    });
  }


});


  
