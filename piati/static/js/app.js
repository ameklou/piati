function PiatiMap (selector, projects) {
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    var map = new L.Map(selector, {
        center: new L.LatLng(15,-5),
        zoom: 6,
        scrollWheelZoom: false
    });
    var tilelayer = new L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Data © OpenStreetMap, tiles © HOT'
    }).addTo(map);

    var projectsLayer = L.featureGroup().addTo(map);
    function projectToMarkers (project) {
        var template = "<h3>{name}</h3><a href='{url}'>{projectName}</a>";
        if (project.locations) {
            var location, marker;
            for (var i = 0; i < project.locations.length; i++) {
                location = project.locations[i];
                marker = L.marker([location.lat, location.lng]);
                marker.bindPopup(L.Util.template(template, {name: location.name, url: project.url, projectName: project.name}));
                projectsLayer.addLayer(marker);
            }
        }
    }

    this.update = function (projects) {
        projectsLayer.clearLayers();
        for(var id in projects) {
            projectToMarkers(projects[id]);
        }
    };
    this.update(projects);
    this.map = map;
    // map.fitBounds(projectsLayer.getBounds()); // => Strange behaviour in 0.8-dev
    return this;
}

Array.prototype.flattenMap = function(func /*, thisArg */)
{
    "use strict";

    if (this === void 0 || this === null) throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof func !== "function") throw new TypeError();

    var res = [], r;
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++)
    {
        if (i in t) {
            r = func.call(thisArg, t[i], i, t);
            if (r instanceof Array) {
                res = res.concat(r);
            } else {
                res.push(r);
            }
        }
    }

    return res;
};


var PiatiPie = function (accessor) {

    var cv_w = 300,                        //width
        cv_h = 300,                            //height
        cv_r = 100,                            //radius
        cv_color = d3.scale.category20b();     //builtin range of colors
  
    var cv_svg = d3.select("#tab-charts")
        .append("svg:svg")              //create the SVG element inside the <body>
        .attr("width", cv_w)           //set the width and height of our visualization (these will be attributes of the <svg> tag
        .attr("height", cv_h)
        .append("svg:g")                //make a group to hold our pie chart
        .attr("transform", "translate(" + cv_r + "," + cv_r + ")");    //move the center of the pie chart from 0, 0 to radius, radius

    var cv_arc = d3.svg.arc()              //this will create <path> elements for us using arc data
        .outerRadius(cv_r);

    var cv_pie = d3.layout.pie()           //this will create arc data for us given a list of values
        .value(function(d) { return d.value; });    //we must tell it out to access the value of each element in our data array


    this.updateWith = function () {
        var data = accessor();
        var cv_path = cv_svg.selectAll("path").data(cv_pie(data));
        var cv_text = cv_svg.selectAll("text").data(cv_pie(data));
        cv_path.exit().remove();
        cv_text.exit().remove();
        
        cv_path.enter().append("path");
        cv_path.attr("fill", function(d, i) { return cv_color(i); } )
            .attr("d", cv_arc);
        cv_text.enter()
            .append("text");
        cv_text.attr("transform", function(d) {
                d.innerRadius = 0;
                d.outerRadius = cv_r;
                return "translate(" + cv_arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .attr("font-weight", "bold")
            .attr("fill", "#FFFFFF")
            .attr("font-size", "10px")
            .text(function(d) { return "" + d.data.label + " (" + d.value + ")"; });
        
    };
    this.updateWith();
    return this;
};


function Projects(data) {

    var THIS = {

        init: function (data) {
            this.data = data;
            return this;
        },

        getSectorsValues: function (d) {
            return d.sectors.map(function (s) { return s.name; });
        },

        getOrgsValues: function (d) {
            return d.orgs.map(function (s) { return s.name; });
        },

        getTopicsValues: function (d) {
            return d.topics.map(function (s) { return s; });
        },

        getStatusValue: function (d) {
            return d.status;
        },

        getBudgetValue: function (d) {
            return parseInt(d.budget, 10);
        }

    };

    return THIS.init(data);

}

d3.visible = function () {
    return this.style.display !== "none";
}

d3.moneyFormat = function (val) {
    return d3.format('n')(val) + '€';
}

d3.listFilter = function (selection, filters, mainOptions) {

    mainOptions = mainOptions || {};
    var that = this,
        dispatch = d3.dispatch("filter"),
        totalContainer = d3.select(mainOptions.parent).append('div').classed('total', true);
    that.filters = {};
    var displayTotal = function () {
        totalContainer.text(selection.filter(d3.visible).size() + " résultat(s) sur " + selection.size() + " sélectionné(s)");
    }
    var filterData = function (d) {
        var filter;
        for (var i in that.filters) {
            filter = that.filters[i];
            if (!filter.pass(d)) {
                return 'none';
            }
        }
        return null;
    };
    var filter = function () {
        selection.style('display', filterData);
        displayTotal();
        dispatch.filter();
    };
    that.filter = filter;
    var toParams = function () {
        var params = [];
        for (var i in that.filters) {
            params = params.concat(that.filters[i].toParams());
        }
        return params;
    }
    that.toParams = toParams;
    var construct = function (type) {
        var types = {
            checkbox: CHECKBOX,
            radio: RADIO,
            range: RANGE
        }, _ = {};
        for (var i in API) {
            _[i] = API[i];
        }
        for (var i in types[type]) {
            _[i] = types[type][i];
        }
        return _;
    };

    var API = {

        init: function (key, selection, options) {
            this.type = options.type || 'checkbox';
            this.key = key;
            this.selection = selection;
            this.data = selection.data();
            this.label = options.label || 'Filter';
            this.parent = mainOptions.parent || document.body;
            this.accessor = options.accessor || function (d) { return d[key]; };
            this.defaults = d3.set(mainOptions.defaults? mainOptions.defaults[this.key] : []);
            this._buildContainer();
            this.build();
            return this;
        },

        _buildContainer: function () {
            this.container = d3.select(this.parent).append('fieldset');
            this.container.node().id = this.key + "Filter";
            this.container.append('legend').text(this.label).on('click', function () {
                d3.select(this.parentNode).classed('on', function () { return !d3.select(this).classed('on');});
            });
            if (this.defaults.values().length) {
                this.container.classed('on', true);
            }
            return this.container;
        }

    };

    var CHECKBOX = {

        build: function () {
            var values = d3.set(this.data.flattenMap(this.accessor)).values(),
                that = this;
            var labels = this.container.selectAll('label').data(values);
            labels.enter().append('label').sort(function (a, b) { return a.localeCompare(b)});
            labels.html(function (d) {return "<span> " + d + "</span>";});
            this.inputs = labels.insert('input', 'span').attr('type', this.type).attr('name', this.key).attr('value', function (d) {return d;}).on('change', filter);
            this.inputs.each(function (d) {
                this.checked = that.defaults.has(d);
            })
            dispatch.on('filter.' + this.key, function () {
                var values = d3.set(that.selection.filter(d3.visible).data().flattenMap(that.accessor));
                labels.classed('inactive', function (d) {return values.has(d) ? false : true;});
            });
        },

        pass: function (d) {
            var values = d3.set(this.inputs.filter(function () {return this.checked;}).data()),
                pass = true, value;
            if (values.values().length) {
                if (d[this.key] instanceof Array) {
                    pass = false;
                    for (var i = 0; i < d[this.key].length; i++) {
                        if (d[this.key][i] === null) { continue; }
                        value = typeof d[this.key][i] === "object" ? d[this.key][i].name : d[this.key][i];
                        if (values.has(value)) {
                            pass = true;
                            break;
                        }
                    }
                } else {
                    pass = values.has(d[this.key]);
                }
            }
            return pass;
        },

        toParams: function () {
            var key = this.key;
            return this.inputs.filter(function () {return this.checked}).data().map(function (d) {
                return key + '=' + encodeURIComponent(d);
            });
        }

    };

    var RADIO = {

        build: function () {
            CHECKBOX.build.call(this);
            var inputs = this.inputs;
            this.container.append('label').append('small').text('Tout décocher').on('click', function () {
                inputs.each(function () {
                    this.checked = false;
                    that.filter();
                });
            });
        },

        pass: CHECKBOX.pass,

        toParams: CHECKBOX.toParams

    }

    var RANGE = {

        build: function () {
            // this.container.classed('on', true);
            var values = this.data.flattenMap(this.accessor),
                label = this.container.append('label'),
                defaultTo, defaultFrom;
            this.min = d3.min(values),
            this.max = d3.max(values);
            this.defaults.forEach(function (d) {
                d = decodeURIComponent(d);
                switch (d.slice(0,1)) {
                    case ">":
                        defaultFrom = parseInt(d.slice(1), 10);
                        break;
                    case "<":
                        defaultTo = parseInt(d.slice(1), 10);
                        break;
                    default:
                        // pass
                }
            });
            this.slider = d3.slider().value([defaultFrom || this.min, defaultTo || this.max]).min(this.min).max(this.max).step(100);
            label.call(this.slider);
            var rangeDisplay = this.container.append('label');
            var displayRange = function (values) {
                rangeDisplay.text(d3.moneyFormat(values[0]) + " — " + d3.moneyFormat(values[1]));
            }
            displayRange(this.slider.value());
            this.slider.on('slide', function (e, values) {
                displayRange(values);
            });
            this.slider.on('slideend', function (e, values) {
                displayRange(values);
                filter();
            });
        },

        from: function () {
            return this.slider.value()[0];
        },

        to: function () {
            return this.slider.value()[1];
        },

        pass: function (d) {
            return this.accessor(d) >= this.from() && this.accessor(d) <= this.to();
        },

        toParams: function () {
            var params = [];
            if (this.from() !== this.min) {
                params.push(this.key + '=' + encodeURIComponent('>' + this.from()));
            }
            if (this.to() !== this.max) {
                params.push(this.key + '=' + encodeURIComponent('<' + this.to()));
            }
            return params;
        }


    }

    var options;
    for (var i in filters) {
        options = filters[i];
        that.filters[i] = construct(options.type || 'checkbox').init(i, selection, options);
    };
    d3.rebind(this, dispatch, 'on');
    return this;
}


function PiatiProjectsBrowser(projects, options) {

    var API = {

        init: function (options) {
            var that = this;
            // this.dispatch = d3.dispatch("filter");
            this.filters = ['status', 'sectors', 'orgs', 'topics'];
            var sortDiv = d3.select('#tab-data').insert('div').classed('sort', true).text('Trier par '),
                titleSort = sortDiv.append('a').text('titre'),
                budgetSort = sortDiv.append('a').text('budget');
            var toggleSort = function (key, mode) {
                var desc = d3.select(this).classed('asc');
                sortDiv.selectAll('a').classed('asc desc', false);
                d3.select(this).classed('desc', function () {return desc === true});
                d3.select(this).classed('asc', function () {return desc === false});
                var stringComparator = function (a, b) {
                    return desc ? b[key].localeCompare(a[key]) : a[key].localeCompare(b[key]);
                };
                var numberComparator = function (a, b) {
                    return desc ? b[key] - a[key] : a[key] - b[key];
                };
                that.list.sort(mode === "string" ? stringComparator : numberComparator);
            };
            titleSort.on('click', function () { toggleSort.call(this, 'name', 'string')});
            budgetSort.on('click', function () { toggleSort.call(this, 'budget')});

            this.list = d3.select('#tab-data')
                          .selectAll('li')
                          .data(projects.data);
            this.list.enter().append("li");
            this.list.html(this.renderProject);
            this.mapHandler = new PiatiMap('tab-map', projects.data);
            this.statusPie = new PiatiPie(API.bind(this.computeStats, this, 'status'));
            this.sectorsPie = new PiatiPie(API.bind(this.computeStats, this, 'sectors', 'name'));

            d3.selectAll('.tabs a').on('click', function () {
                d3.event.preventDefault();
                that.showTab(this.getAttribute('href'));
                that.updateHash();
            });


            var hash = window.location.hash.substr(1).split('?'),
                tab = hash[0] || 'data';
            this.showTab('#tab-' + tab);
            var filterDefaults = {}
            if (hash[1]) {
                var params = hash[1].split('&'), param;
                for (var i = 0; i < params.length; i++) {
                    param = params[i].split('=');
                    filterDefaults[param[0]] = filterDefaults[param[0]] || [];
                    filterDefaults[param[0]].push(param[1]);
                }
            }

            var filters = {
                status: {accessor: projects.getStatusValue, label: "Statut", type: "radio"},
                sectors: {accessor: projects.getSectorsValues, label: "Secteurs"},
                orgs: {accessor: projects.getOrgsValues, label: "Organisations"},
                topics: {accessor: projects.getTopicsValues, label: "Thèmes"},
                budget: {type: "range", label: "Budget"}
            }

            this.filtersHandler = d3.listFilter(this.list, filters, {parent: "#piatiFilters", defaults: filterDefaults});

            this.filtersHandler.on('filter', function () {
                that.mapHandler.update(that.visibleData());
                that.statusPie.updateWith();
                that.sectorsPie.updateWith();
                that.updateHash();
            });
            this.filtersHandler.filter();

            return this;
        },

        renderProject: function (d) {
            var content = '';
            content += "<h4><a href='" + d.url + "''>" + d.name + "</a> <small>[" + d.id + "]</small></h4>";
            content += "<div>Budget: " + d3.moneyFormat(d.budget) + "</div>";
            content += "<div>Statut: " + d.status + "</div>";
            content += "<div>Source: " + d.source.name + "</div>";
            content += "<hr />";
            return content;
        },

        visible: function () {
            return this.list.filter(API.isVisible);
        },

        visibleData: function () {
            return this.visible().data();
        },

        computeStats: function (key, prop) {
            var values = d3.map(), sector;
            var increment = function (key) {
                if (prop) {
                    key = key[prop];
                }
                if (!values.has(key)) {
                    values.set(key, {
                        value: 0,
                        label: key
                    });
                }
                values.get(key).value++;
            };
            this.visible().each(function (d) {
                if (d[key] instanceof Array) {
                    for (var i = 0; i < d[key].length; i++) {
                        increment(d[key][i]);
                    }
                } else {
                    increment(d[key]);
                }
            });
            return values.values();
        },

        updateHash: function () {
            var tab = d3.select('.tab-content.on').node().id.substr(4);
            var params = this.filtersHandler.toParams();
            window.location.hash = tab + (params.length ? '?' + params.join('&') : '');
        },

        showTab: function (id) {
            d3.selectAll('.tab-content').classed('on', false);
            d3.selectAll('.tabs a').classed('on', false);
            d3.select(".tabs a[href='" + id + "']").classed('on', true);
            d3.select(id).classed('on', true);
            this.mapHandler.map.invalidateSize();
        },

        /* *************** */
        /* *** HELPERS *** */
        /* *************** */

        bind: function (fn, obj) {
            var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
            return function () {
                return fn.apply(obj, args || arguments);
            };
        },

        isVisible: function (d) {
            return this.style.display !== "none";
        },

        idFromProperty: function (prop) {
            return '#' + prop + 'Filter';
        }

    };

    return API.init(options);
}

