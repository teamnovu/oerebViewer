export class LayersService {
    constructor(Notification, EsriToken) {
        'ngInject';

        this.ol = ol;
        this.Notification = Notification;
        this.EsriToken = EsriToken;

        this.layers = [];
        this.resolvedLayers = [];
        this.parser = new ol.format.WMTSCapabilities();

        /*
         * REGISTER LAYERS HERE
        */

        // Geometrie der Kantonsgrenze
        // this.add(this.asyncCantonLayer());

        // Grundbuchplan schwarz-weiss
        this.add(this.asyncGrundbuchMapLayer());

        // Grundbuchplan schwarz-weiss
        this.add(this.asyncGrundbuchLowResolutionMapLayer());

        // Orthophoto für zweite Hintergrundansicht
        this.add(this.asyncOrthoPhotoLayer());
    }
    /*
        Views definitions:
     */
    defaultView() {
        return 'map';
    }

    setView(name) {
        if (name === 'map') {
            this.show('grundbuchMap'); // layer name
            this.hide('orthoPhoto');
        }

        if (name === 'satellite') {
            this.show('orthoPhoto');
            this.hide('grundbuchMap');
        }
    }


    /* asyncCantonLayer() {
        // documentation for ol.source.TileWMS: http://geoadmin.github.io/ol3/apidoc/ol.source.TileWMS.html
        let params = {
            'LAYERS': 'Kantonsgrenzen',
            'TILED': true,
            'VERSION': '1.3.0',
            'FORMAT': 'image/png',
            'CRS': 'EPSG:2056'
        };

        let wmsOEREBSource = new this.ol.source.TileWMS(({
            url: 'https://wms.geo.gr.ch/admineinteilung',
            params: params,
            serverType: 'geoserver',
        }));

        // http://geoadmin.github.io/ol3/apidoc/ol.layer.Tile.html
        let wmsOEREB = new this.ol.layer.Tile({
            opacity: 1,
            visible: true, // is visible per default
            source: wmsOEREBSource,
            name: 'cantonMap',
        });

        wmsOEREB.setZIndex(500);

        return wmsOEREB;
    } */

    asyncGrundbuchMapLayer() {
        // documentation for ol.source.TileWMS: http://geoadmin.github.io/ol3/apidoc/ol.source.TileWMS.html
        let params = {
            // 'LAYERS': 'lcsf_sw,lcsfproj,sosf_sw,lcsfgeb_sw,lcobj_nr,lcobj_namen,plsf,plli,plna,soli,sopt,soobj_namen,soobj_nr,locpos,hadr_namen,hadr_nr,resf,dprsf,resf_nr,dprsf_nr,mbsf,resfproj,resfproj_nr,dprsfproj,dprsfproj_nr,osbp,cppt,tbbp,lnna',
			// 'LAYERS': 'boflaeche_sw,boflaechesymbol_v,projboflaeche,flaechenelement_sw,flaechenelementsymbol_v,boflaeche_geb_sw,rohrleitung_linienelement,rohrleitung_beschriftung,boflaeche_linien,gebaeudenummer,bo_objektname,flaechenelement_linien,linienelement,linienelementsymbol_v,punktelement,eo_objektname,eo_objektnummer,gebaeudename,lokalisationsname,hausnummer,ortschaftsname,flurname,ortsname,gelaendename,projliegenschaft,projgrundstueckpos,liegenschaft,selbstrecht,bergwerk,grundstueckpos,gemeindegrenze,grenzpunkt,hfp3,lfp3,hfp2,lfp2,hfp1,lfp1',
            'LAYERS': 'Hintergrund grau',
            'TILED': true,
            'VERSION': '1.3.0',
            'FORMAT': 'image/png',
            'CRS': 'EPSG:2056'
        };

        let wmsOEREBSource = new this.ol.source.TileWMS(({
            //url: 'https://wms-test.gis.gr.ch/wms/gbplan_oereb',
            url: 'https://wms.geo.gr.ch/hg_oereb',
            //url: 'https://wms.geo.gr.ch/hg_oereb',
            params: params,
            serverType: 'geoserver',
        }));

        // http://geoadmin.github.io/ol3/apidoc/ol.layer.Tile.html
        let wmsOEREB = new this.ol.layer.Tile({
            opacity: 1,
            visible: true, // is visible per default
            source: wmsOEREBSource,
            name: 'grundbuchMap'
        });

        wmsOEREB.setZIndex(1);

        return wmsOEREB;
    }


    asyncGrundbuchLowResolutionMapLayer() {
        let self = this;
        let configuration = {
            url: 'https://www.geoservice.apps.be.ch/geoservice2/rest/services/a4p/a4p_hintergrund_grau_n_bk/MapServer/WMTS/1.0.0/WMTSCapabilities.xml',
            token: this.globalTokenForWMTS,
        };

        // fetches capabilities from a service
        return this.waitForToken(configuration.token).then(function () {
            return fetch(configuration.url + '?token=' + configuration.token.token).then(function (response) {
                return response.text();
            })
        }).then(function (text) {
            let result = self.parser.read(text);

            // parses options based on the capabilities
            let options = ol.source.WMTS.optionsFromCapabilities(result, {
                layer: 'a4p_a4p_hintergrund_grau_n_bk',
                matrixSet: 'EPSG:2056'
            });
            self.applyTokeToWMTSOptions(configuration.token, options);

            // http://geoadmin.github.io/ol3/apidoc/ol.source.WMTS.html
            let wmtsSource = new ol.source.WMTS(options);
            self.refreshOnInvalidToken(configuration.token, wmtsSource);

            // creates ol.layer.Tile with the prepared source
            let wmtsLayer = new ol.layer.Tile({
                opacity: 1,
                source: wmtsSource,
                visible: true, // is visible per default
                name: 'grundbuchLowResolutionMap' // the name is necessary for interacting with this layer, see setView method
            });

            wmtsLayer.setZIndex(1);

            return wmtsLayer;
        }).catch(function(ex) {
            self.Notification.warning('a4p_hintergrund_grau_n_bk konnte nicht geladen werden.');
        });
    }

    /*
     Implementation of a WMTS - based on a Capabilites.xml
     */
    asyncOrthoPhotoLayer() {
        // documentation for ol.source.TileWMS: http://geoadmin.github.io/ol3/apidoc/ol.source.TileWMS.html
        let params = {
            'LAYERS': 'hg_luftbild',
            'TILED': true,
            'VERSION': '1.3.0',
            'FORMAT': 'image/png',
            'CRS': 'EPSG:2056'
        };

        let wmsOEREBSource = new this.ol.source.TileWMS(({
            url: 'https://wms.geo.gr.ch/hg_luftbild',
            params: params,
            serverType: 'geoserver',
        }));

        // http://geoadmin.github.io/ol3/apidoc/ol.layer.Tile.html
        let wmsOEREB = new this.ol.layer.Tile({
            opacity: 1,
            visible: false, // is not visible per default
            source: wmsOEREBSource,
            name: 'orthoPhoto'
        });

        wmsOEREB.setZIndex(1);

        return wmsOEREB;
    }
    /*
        LAYERS END
     */

    /*
        DO NOT EDIT CODE AFTER THIS COMMENT
     */

    // checks if layer is currently active
    isActive(name) {
        return (this.active == name);
    }

    // hide a layer by name
    hide(name, inverse = false) {
        this.resolvedLayers.forEach(layer => {
            if (layer !== undefined && layer.M && layer.M.name == name) {
                layer.visible = inverse;
            }
        });

        return name;
    }

    // show a layer by name
    show(name) {
        return this.hide(name, true);
    }

    get(callback) {
        let layerService = this;

        let requests = this.layers.map((layer) => {
            return new Promise((resolve) => {
                if (layer instanceof Promise) {
                    layer.then(function (value) {
                        if (value !== undefined)
                            layerService.resolvedLayers.push(value);

                        resolve();
                    });
                } else {
                    layerService.resolvedLayers.push(layer);
                    resolve();
                }

            });
        });

        Promise.all(requests).then(() => callback(layerService.resolvedLayers));
    }

    add(layer) {
        this.layers.push(layer);
    }
}


