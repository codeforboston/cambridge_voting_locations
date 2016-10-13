require.config({
    paths: {
        jquery: '../bower_components/jquery/jquery',
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
        geojson: '../bower_components/geojson-google-maps/GeoJSON',
        json: 'vendor/json',
        moment: '../bower_components/moment/moment',
        momentrange: '../bower_components/moment-range/dist/moment-range.min'
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


require(['jquery', 'polling_location_finder', 'bootstrapCollapse', 'bootstrapTab'], function($, findPollingLocationFor) {
    //'use strict';

    // $('.modal').modal('show');
    // //attach autocomplete

     var $address = $('#address');
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


    var autocomplete = new google.maps.places.Autocomplete($address.get(0), options);

    autocomplete.addListener('place_changed', function() {
        // var place = autocomplete.getPlace();
        searchForAddress();
    });



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
		console.log(address);

        // clear details pane
        $('#directions').empty();


        // go right to the first result if there's only one, or display a list if there are multiples
        function displaySearchResults(results) {
            
                console.log('This is what gets passed into the displaySearchResults');
                console.log(results);
            
            var addressClickHandler = function() {
                var location = $(this).data('location');
                $('#directions').empty();
                
                console.log('This is the location that is passed into the adressClick Handler');
                console.log(location);

                
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
