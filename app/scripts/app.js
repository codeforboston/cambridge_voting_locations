require.config({
    paths: {
        jquery: '../bower_components/jquery/jquery',
        bootstrapAffix: '../bower_components/sass-bootstrap/js/affix',
        bootstrapAlert: '../bower_components/sass-bootstrap/js/alert',
        bootstrapButton: '../bower_components/sass-bootstrap/js/button',
        bootstrapCarousel: '../bower_components/sass-bootstrap/js/carousel',
        bootstrapCollapse: '../bower_components/sass-bootstrap/js/collapse',
        bootstrapDropdown: '../bower_components/sass-bootstrap/js/dropdown',
        bootstrapModal: '../bower_components/sass-bootstrap/js/modal',
        bootstrapPopover: '../bower_components/sass-bootstrap/js/popover',
        bootstrapScrollspy: '../bower_components/sass-bootstrap/js/scrollspy',
        bootstrapTab: '../bower_components/sass-bootstrap/js/tab',
        bootstrapTooltip: '../bower_components/sass-bootstrap/js/tooltip',
        bootstrapTransition: '../bower_components/sass-bootstrap/js/transition',
        text: '../bower_components/requirejs-text/text',
        geojson: '../bower_components/geojson-google-maps/GeoJSON',
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
        }
    }
});


require(['jquery', 'polling_location_finder', 'bootstrapModal'], function($, findPollingLocationFor) {
    //'use strict';

    $('.modal').modal('show');
    // //attach autocomplete
     var input = document.getElementById('address');
    //
    // //starting place for google maps typeahead search
    // var defaultBounds = new google.maps.LatLngBounds(
    //     //harvard square
    //     new google.maps.LatLng(42.3735695,-71.1233489)
    // );


    var defaultBounds = new google.maps.LatLngBounds(

        new google.maps.LatLng(42.360129, -71.148834),
            new google.maps.LatLng(42.389868, -71.075535)
        );

    //
    var options = {
        bounds: defaultBounds
    };

    //
    autocomplete = new google.maps.places.Autocomplete(input, options);



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
                });
            }, geolocationErrorDisplay);
        } else {
            geolocationErrorDisplay();
            // reset button if failed
            $btn.attr('disabled', false);
            $btn.html(initialText);
            $btn.removeClass('loading');
        }
    });

    $('form').on('submit', function(e) {
        e.preventDefault(); // don't submit form
        var address = $('#address').val();
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
                $('.modal').modal('hide');
            }
        }

        // only valid Cambridge street addresses, please
        function addressIsCambridgeStreetAddress(address) {
            var zipCodeComponent = address.address_components[address.address_components.length - 1],
                zipCode = zipCodeComponent && zipCodeComponent.short_name;
            var isInCambridge = ~$.inArray(zipCode, ['02138', '02139', '02140', '02141', '02142', '02238']),
                isStreetAddress = ~$.inArray('street_address', address.types);
            return isInCambridge & isStreetAddress;
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
                    }
                });
            } else {
                displaySearchResults(results);
            }
        });
    });
});
