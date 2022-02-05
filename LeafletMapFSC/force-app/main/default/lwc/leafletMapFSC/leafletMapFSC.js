import { LightningElement, api, track } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/leafletFSC';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
const MAP_HEIGHT = 500;

export default class LeafletMapFSC extends LightningElement {
    @track showMap = false;
    @track mapResult = {
        map: null, //temp leaflet map obj
        lat: null, //temp latitude
        lng: null //temp longitude
    };
    @track showPinpointCurrentLocButton;
    @api popupTextValue;
    @api currentLocationButtonLabel;
    @api required;
    @api draggable;

    @api
    get latitude() {
        const attributeLatitudeChangeEvent = new FlowAttributeChangeEvent('latitude',this.mapResult.lat);
        this.dispatchEvent(attributeLatitudeChangeEvent);
        return this.mapResult.lat;
    }
    set latitude(value) {
        this.mapResult.lat = value;
    }
    @api
    get longitude() {
        const attributeLongitudeChangeEvent = new FlowAttributeChangeEvent('longitude',this.mapResult.lng);
        this.dispatchEvent(attributeLongitudeChangeEvent);
        return this.mapResult.lng;
    }
    set longitude(value) {
        this.mapResult.lng = value;
    }
    @api
    validate() {
        if (
            (this.required &&
            this.latitude != null &&
            this.longitude != null)
            ||
            (!this.required)
        ) {
            return { isValid: true };
        } else {
            return {
                isValid: false,
                errorMessage:
                    'Please make sure Latitude and Longitude are filled'
            };
        }
    }

    connectedCallback() {
        if (this.latitude && this.longitude) {
            this.showMap = true;
            this.initMap();
        }
        if (this.currentLocationButtonLabel) {
            this.showPinpointCurrentLocButton = true;
        }
    }

    initMap() {
        Promise.all([
            loadStyle(this, LEAFLET + '/leaflet.css'),
            loadScript(this, LEAFLET + '/leaflet.js')
        ])
            .then(() => {
                this.template.querySelectorAll(
                    'div'
                )[1].style.height = `${MAP_HEIGHT}px`;
                this.drawMap();
            })
            .catch((error) => {
                alert(
                    'Error lib loading\nPlease contact your Administrator. trace : ' +
                        error
                );
            });
    }

    drawMap() {
        let mapResult = this.mapResult;
        let lat = this.latitude;
        let lng = this.longitude;
        const POPUPTEXTVAL = this.popupTextValue;
        const DRAGGABLE = this.draggable;
        let container = this.template.querySelectorAll('div')[1];
        let map = L.map(container, {
            zoomControl: true,
            touchZoom: 'center',
            tap: false
        });
        L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);
        if (lat == null && lng == null) {
            map.locate({ setView: true, enableHighAccuracy: true })
                .on('locationfound', function (e) {
                    mapResult.lat = e.latitude;
                    mapResult.lng = e.longitude;
                    map.setView([mapResult.lat, mapResult.lng], 18);
                    let marker = L.marker([mapResult.lat, mapResult.lng], {
                        draggable: DRAGGABLE
                    }).bindPopup(POPUPTEXTVAL);
                    map.addLayer(marker);
                    marker.on('move', function (e) {
                        mapResult.lat = e.latlng.lat;
                        mapResult.lng = e.latlng.lng;
                        marker.bindPopup(POPUPTEXTVAL);
                    });
                })
                .on('locationerror', function (e) {
                    alert(
                        'Could not access location\nPlease allow access to your location'
                    );
                });
        } else {
            map.setView([lat, lng], 18);
            let marker = L.marker([lat, lng], { draggable: DRAGGABLE });
            mapResult.lat = lat;
            mapResult.lng = lng;
            map.addLayer(
                marker.bindPopup(POPUPTEXTVAL)
            );
            marker.on('move', function (e) {
                mapResult.lat = e.latlng.lat;
                mapResult.lng = e.latlng.lng;
                marker.bindPopup(POPUPTEXTVAL);
            });
        }
        mapResult.map = map;
    }

    refreshMap() {
        this.mapResult.map.off();
        this.mapResult.map.remove();
        this.drawMap();
    }

    searchUserLocation(event) {
        if (!this.showMap) {
            this.showMap = true;
            this.initMap();
        } else {
            this.mapResult.lat = null;
            this.mapResult.lng = null;
            this.refreshMap();
        }
    }
}