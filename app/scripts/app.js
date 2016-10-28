require.config({
  paths: {
    jquery: '../bower_components/jquery/jquery',
    scrollTo: '../bower_components/jquery.scrollTo/jquery.scrollTo',
    bootstrapAffix: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/affix',
    bootstrapAlert: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/alert',
    bootstrapButton: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/button',
    bootstrapCarousel: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/carousel',
    bootstrapCollapse: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/collapse',
    bootstrapDropdown: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/dropdown',
    bootstrapModal: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/modal',
    bootstrapPopover: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/popover',
    bootstrapScrollspy: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/scrollspy',
    bootstrapTab: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/tab',
    bootstrapTooltip: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/tooltip',
    bootstrapTransition: '../bower_components/bootstrap-sass/assets/javascripts/bootstrap/transition',
    text: '../bower_components/requirejs-text/text',
    ejs: '../bower_components/ejs/ejs',
    moment: '../bower_components/moment/moment',
    moment_range: '../bower_components/moment-range/dist/moment-range',
    json: 'vendor/json'
  },
  shim: {
    bootstrapAffix: {
      deps: ['jquery']
    },
    bootstrapAlert: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapButton: {
      deps: ['jquery']
    },
    bootstrapCarousel: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapCollapse: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapDropdown: {
      deps: ['jquery']
    },
    bootstrapModal: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapPopover: {
      deps: ['jquery', 'bootstrapTooltip']
    },
    bootstrapScrollspy: {
      deps: ['jquery']
    },
    bootstrapTab: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapTooltip: {
      deps: ['jquery', 'bootstrapTransition']
    },
    bootstrapTransition: {
      deps: ['jquery']
    },
    geojson: {
      exports: 'GeoJSON'
    },
    underscore: {
      exports: '_'
    },
    ejs: {
      exports: 'ejs'
    }
  }
});


require(['jquery',
    'early_voting_mgr', 'polling_location_finder', 'map_service',
    'json!vendor/EARLY_VOTING_AddressPoints.geojson'],
  function ($, earlyVotingManager, findPollingLocationFor, mapService, earlyPollingJSON) {
    'use strict';

    window.location.hash = window.location.hash || 'early-voting';

    // Trigger the hashchange event if going to a different tab
    $('.cambridge-tabs a[href^=#]').on('click', function () {
      var target = $(this).attr('href');
      if (target != window.location.hash) {
        window.location.hash = target;
      }
    });

    // Sets the "active" styling on the active tab link
    $(window).on('hashchange', function () {
      $('.cambridge-tabs a').parent().removeClass("active");
      $('.cambridge-tabs a[href=' + window.location.hash + ']').parent().addClass("active");

      if (window.location.hash == "#early-voting") {

        mapService.displayEarlyPollingMarkers();
      } else if (window.location.hash == "#election-day") {

        mapService.displayUserPollingPlace();
      }

    });

    $(window).trigger('hashchange'); // if the user navigated directly to a tab, set that active styling this way


    earlyVotingManager.init();


    var $address = $('#address');

    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(42.360129, -71.148834),
      new google.maps.LatLng(42.389868, -71.075535)
    );
    var autocomplete = new google.maps.places.Autocomplete($address.get(0), {
      bounds: defaultBounds
    });

    autocomplete.addListener('place_changed', updateElectionDayDirections);


    $('#view-directions').on('click', function () {
      $('#info').toggleClass('up');
      if ($('#info').hasClass('up')) {
        $('#view-directions').html('<span class="icon-info-sign"></span> View map');
      } else {
        $('#view-directions').html('<span class="icon-info-sign"></span> View directions');
      }
    });

    function geolocationErrorDisplay() {
      $('#notice')
        .addClass('error')
        .html("We weren't able to determine your current location. Try typing in your address?");
    }

    $('.current-location').on('click', function () {
      var $btn = $(this);
      var initialText = $btn.html();
      // replace button text with loading text on disabled button
      $btn.attr('disabled', true);
      $btn.find('.button-text').text('Finding your location.');
      $btn.addClass('loading');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
          var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
          findPollingLocationFor(currentLocation, function () {
            $btn.attr('disabled', false);
            $btn.html(initialText);
            $btn.removeClass('loading');
            google.maps.event.trigger(map, 'resize');
          });
        }, geolocationErrorDisplay);
      } else {
        geolocationErrorDisplay();
        // reset button if failed
        $btn.attr('disabled', false);
        $btn.html(initialText);
        $btn.removeClass('loading');
        google.maps.event.trigger(map, 'resize');

      }
    });

    function updateElectionDayDirections() {
      var address = $address.val();

      var panel = $('#directions');
      // clear details pane
      panel.empty();

      mapService.searchAddress(address, function(results) {
        mapService.displaySearchResults(results, panel, findPollingLocationFor);
        google.maps.event.trigger(map, 'resize');
      }, function() {
        $('#notice')
          .addClass('error')
          .html($('#noLocation').text());
      });
    }

    $('form').on('submit', function (e) {
      e.preventDefault(); // don't submit form
      updateElectionDayDirections();
    });
  });
