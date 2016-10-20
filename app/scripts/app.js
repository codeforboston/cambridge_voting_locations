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



require(['jquery', 'polling_location_finder', 'bootstrapCollapse', 'early_poll_finder'], function($, findPollingLocationFor, bootstraps, earlyPolling) {

    //'use strict';

    // Tab functionality that uses window.location.hash to create "tabs"
    // that are linkable/shareable/work with the "back" button etc.

    // Defaults to early voting
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
    });

    $(window).trigger('hashchange'); // if the user navigated directly to a tab, set that active styling this way

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
        var place = autocomplete.getPlace();
        searchForAddress();
    });

     /* not working so well with the new layout
    $('#view_directions').on('click', function () {
        $('#info').toggleClass('up');
        if ($('#info').hasClass('up')) {
            $('#view_directions').html('<span class="icon-info-sign"></span> View map');
        } else {
            $('#view_directions').html('<span class="icon-info-sign"></span> View directions');
        }
    });
	*/
    
    //inits the module that controls all the poll info cards and shows the pointers on the map
    /* Here are a list of all the methods of this module 
    
        init()  = This inits the module and populates all the poll info cards with hours and status. Also shows the pointers on the map.
        show()  = show the poll info cards if they are hidden. Perfect for when switching tabs.
        hide()  = hide all the poll info cards. Perfect for when switching tabs.
        isOpen(poll_label) = takes in the poll letter, i.e A and checks if that poll is open or not.
        getTime() = gets the current time.
        getStatus(poll_label) = takes in the poll letter and returns the status, i.e "closing" "Open" and "closed"
        expandCard(poll_label) = expands the poll info card of the specified poll through the label parameter.
        collapseAll() = collapses all the poll info cards that are open.
        showMakers() = shows the markers for each poll on the map.
        hideMarkers() = hides all the markers on the map, perfect for when switching tabs.    
    
    */

	window.pollModule = earlyPolling;
    earlyPolling.init();
    $('#currentTime').html(earlyPolling.getTime());
    
    
	
	$('.current-location').on('click', function(){
		var $btn = $(this);
        var initialText = $btn.html();

        if (navigator.geolocation) {
			//if supported get the user gps location
            navigator.geolocation.getCurrentPosition(successCall, failCall);
        } else {
			// warn the user that gps location is not supported
			$('#notice')
				.addClass('error')
				.html("Seems your device does NOT support GSP location. Try typing in your address?");
        }
		
		function successCall(position){
			// replace button text with loading text on disabled button
			$btn.attr('disabled', true);
			$btn.find('.button-text').text('Finding your location.');
			$btn.addClass('loading');
            var currentLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
             
			findPollingLocationFor(currentLocation, function() {
                    $btn.attr('disabled', false);
                    $btn.html(initialText);
                    $btn.removeClass('loading');
                    google.maps.event.trigger(map, 'resize');
                });
			
		}
		
		function failCall(){
			// reset button if failed
			$('#notice')
				.addClass('error')
				.html("We weren't able to determine your current location. Try typing in your address?");
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
		
		geocoder.geocode({
            address: address,
            componentRestrictions: {
                administrativeArea: 'Massachusetts',
                country: 'US'
            }
        }, processGeocode);
	
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
		
			var cambridgeZipcodes = ['02138', '02139', '02140', '02141', '02142', '02238'],
				isInCambridge = false,
				isStreetAddress = false,
				addr_components = address.address_components,
				zipCode = "000000";
						
            for (var i = 0; i < addr_components.length; i++) {
                if (addr_components[i].types[0] == "postal_code") {
                    zipCode = addr_components[i].short_name || addr_components[i].long_name;
                }
            }

			//checks if gathred zipcode is in cambridge
            isInCambridge = ($.inArray(zipCode, cambridgeZipcodes)) > -1;
            isStreetAddress = ($.inArray('street_address', address.types)) > -1;

			//return true if both are met: zip code is in cambridge and is street address
            return isInCambridge && isStreetAddress;

        }
		
			//callback function passed into the geocoder of the address
		function processGeocode(results, status){
			
			// if there are multiple results, look for Cambridge-specific street results
			results = $.grep(results, addressIsCambridgeStreetAddress);
			
			// if there are no results, try searching for Cambridge
            if (!results.length) {
				//geocoder.geocode({ address: address + ' Cambridge, MA' }, processGeocode);
                 $('#notice')
                        .addClass('error')
                        .html($('#noLocation').text());
                 } else {
                     displaySearchResults(results);
                     google.maps.event.trigger(map, 'resize');
                }
	
        }
		
    }


    $('form').on('submit', function(e) {
        e.preventDefault(); // don't submit form
        searchForAddress();
    });
});
