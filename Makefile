# Inspired by Mike Bostock's blog post on Why Use Make
# https://bost.ocks.org/mike/make/
#
# This script will (1) download the Polling Locations and Wards/Precincts
# shapefiles from Cambridge's GIS site, (2) unzip them and (3) convert the
# shapefiles into GeoJSON for use in this app.
#
# How to use at your terminal:
# $ make
#

SHELL := /bin/bash -O extglob -c
folder = app/scripts/vendor

all: ELECTIONS_PollingLocations.geojson ELECTIONS_WardsPrecincts.geojson

ELECTIONS_PollingLocations.shp.zip ELECTIONS_WardsPrecincts.shp.zip:
	curl -o ${folder}/$@ 'http://gis.cambridgema.gov/download/shp/$@'

ELECTIONS_%.shp: ELECTIONS_%.shp.zip
	unzip -o ${folder}/$^
	mv ELECTIONS* ${folder} # move the shapefiles to the folder
	touch ${folder}/$@ # updates the modified by timestamp
	rm ${folder}/$^ # remove the zip file

ELECTIONS_%.geojson: ELECTIONS_%.shp
	rm -f ${folder}/$@ # remove if it exists so ogr2ogr doesn't yell at you
	ogr2ogr -f GeoJSON -t_srs crs:84 ${folder}/$@ ${folder}/$^
	rm ${folder}/ELECTIONS*.!(geojson) # remove everything except the geojson files
