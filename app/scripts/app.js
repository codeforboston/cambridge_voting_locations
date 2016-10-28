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
        function($, earlyVotingManager, findPollingLocationFor, mapService, earlyPollingJSON) {
    'use strict';

    window.location.hash = window.location.hash || 'early-voting';

    // Trigger the hashchange event if going to a different tab
    $('.cambridge-tabs a[href^=#]').on('click', function() {
      var target = $(this).attr('href');
      if (target != window.location.hash) {
        window.location.hash = target;
      }
    });

    // Sets the "active" styling on the active tab link
    $(window).on('hashchange', function() {
      $('.cambridge-tabs a').parent().removeClass("active");
      $('.cambridge-tabs a[href='+ window.location.hash +']').parent().addClass("active");

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

    autocomplete.addListener('place_changed', searchForAddress);


    $('#view_directions').on('click', function () {
        $('#info').toggleClass('up');
        if ($('#info').hasClass('up')) {
            $('#view_directions').html('<span class="icon-info-sign"></span> View map');
        } else {
            $('#view_directions').html('<span class="icon-info-sign"></span> View directions');
        }
    });

    function geolocationErrorDisplay() {
        $('#notice')
            .addClass('error')
            .html("We weren't able to determine your current location. Try typing in your address?");
    }

    $('.current-location').on('click', function() {
        var $btn = $(this);
        var initialText = $btn.html();
        // replace button text with loading text on disabled button
        $btn.attr('disabled', true);
        $btn.find('.button-text').text('Finding your location.');
        $btn.addClass('loading');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                findPollingLocationFor(currentLocation, function() {
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

    function searchForAddress () {
        var address = $address.val();
        var geocoder = new google.maps.Geocoder();

        // clear details pane
        $('#directions').empty();

        // go right to the first result if there's only one, or display a list if there are multiples
        function displaySearchResults(results) {
            var addressClickHandler = function() {
                var location = $(this).data('location');
                $('#directions').empty();
                findPollingLocationFor(location);
            };
            if (results.length === 1) {
                findPollingLocationFor(results[0].geometry.location);
            } else {
                var $ul = $('<ul>').addClass('location-choices').appendTo('#directions');
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    var link = $('<a>').text(result.formatted_address).data('location', result.geometry.location).on('click', addressClickHandler);
                    $('<li>').append(link).appendTo($ul);
                }
            }
        }

        // only valid Cambridge street addresses, please
        function addressIsCambridgeStreetAddress(address) {
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
                isNotPO = ($.inArray('post_box', address.types)) == -1;

            return isInCambridge && isNotPO;
        }

        geocoder.geocode({
            address: address,
            componentRestrictions: {
                administrativeArea: 'Massachusetts',
                country: 'US'
            }
        }, function(results, status) {

            // if there are multiple results, look for Cambridge-specific street results
            results = $.grep(results, addressIsCambridgeStreetAddress);
            // if there are no results, try searching for Cambridge
            if (!results.length) {
                geocoder.geocode({ address: address + ' Cambridge, MA' }, function(results, status) {
                    results = $.grep(results, addressIsCambridgeStreetAddress);
                    if (!results.length) {
                        $('#notice')
                            .addClass('error')
                            .html($('#noLocation').text());
                    } else {
                        displaySearchResults(results);
                        google.maps.event.trigger(map, 'resize');
                    }
                });
            } else {
                displaySearchResults(results);
                google.maps.event.trigger(map, 'resize');
            }
        });
    }

    $('form').on('submit', function(e) {
        e.preventDefault(); // don't submit form
        searchForAddress();
    });
});
