
// (c) 2013 Wiley Bennett
// v 2.0
// 
// Bootstrap script
// Defines the namespace and prototype functions for rendering and updating data


var WorldSVG;

function init(error, world, gdp, cdata, disasters) {
    WorldSVG = new World.SVG(error, world, gdp, cdata, disasters);
}

World = {};

World.SVG = function(error, world, gdp, cdata, disasters) {
    var this_ = this;
    
    this.absMinCas = 10;  // for casualty slider
    this.filterSet = [
                        "Drought",
                        "Earthquake",
                        "Epidemic",
                        "Flood",
                        "Industrial Accident",
                        "Famine",
                        "Storm",
                        "Transportation",
                        "Fire",
                        "Miscellaneous"
                     ];
    this.subCatTotSet = {};
    $.each(this_.filterSet, function(k,v) {
        this_.subCatTotSet[v] = 0;
    });
    this.icon = {
        play: '<span class="play-icon"></span>',
        pause: '<span class="pause-icon" style="margin-left:5px;"></span><span class="pause-icon" style="margin-right:5px;"></span>'
    };
    
    this.world = world;
    this.gdpRaw = gdp;
    this.countries = topojson.object(this_.world, this_.world.objects.countries).geometries;
    this.disasters = disasters;
    this.countryData = cdata;
    this.totCas = {};
    
    this.cFilter = null;
    this.zoomSF = 1;
    
    this.cDataMeta = {
        gdp: {
            pre: "$ ",
            suf: "",
            units: "Current USD ($)",
            tooltip: "GDP per Capita: ",
            binLow: 0,
            binHigh: 100000
        },
        totCas: {
            pre: "",
            suf: "",
            units: "from Jan 1900 to Dec 2008",
            tooltip: "Total Casualties: ",
            binLow: 0,
            binHigh: 1000000
        }
    }
    
    this.binColor = ['rgb(227,246,255)', 'rgb(206,238,255)', 'rgb(184,231,254)', 'rgb(163,224,254)', 'rgb(142,217,254)', 'rgb(121,209,254)', 'rgb(99,202,253)', 'rgb(78,195,253)', 'rgb(57,188,253)', 'rgb(36,181,253)'];
    this_.tempBin = [];
    this.grossCas = 0; // null
    
    
    // load-in settings
    this.cData = "gdp";
    this.maxCas = 1000000;
    this.minCas = 100;
    this.openDate = [1,1,1930];
    this.closeDate = [12,31,2000];
    this.filters = [
//                this_.filterSet[0],
//                this_.filterSet[1],
//                this_.filterSet[2],
//                this_.filterSet[3],
//                this_.filterSet[4],
//                this_.filterSet[5],
                this_.filterSet[6],
//                this_.filterSet[7],
//                this_.filterSet[8],
//                this_.filterSet[9]
            ];
            
    // reset object
    this.reset = {
        time: {
                openDate: this_.openDate,
                closeDate: this_.closeDate
            }
    };
    
    
    // get max bin values
    this.gdpByCC = {};
    this.gdpRaw.forEach(function(d) {
        var id = d.id;
        this_.gdpByCC[id] = {};
        delete d.id;
        var cur = 0;
        $.each(d, function(k,v) {
            this_.gdpByCC[id][k] = (parseInt(v)>0)?parseInt(v):cur;
            cur = this_.gdpByCC[id][k];
        });
    });
    this.cDataMeta.gdp.binHigh = this.gdpByCC.max;
    $.each(this_.cDataMeta.gdp.binHigh, function(k,v) {
        this_.cDataMeta.gdp.binHigh[k] = roundTo(parseInt(v)*0.75);
    });
        
    this.binRange = 10;

    this.updateQuants();
    
    this.initData();
    
    this.drawMap();
    this.drawCountries();
    this.setWindowHandlers();
    
    
    // from ui.js
    this.renderScale();
    this.renderCasualtiesSlider();
    this.renderTimeSlider();
    this.renderFilter();
    this.renderCountryWindow();
    this.renderTotCasCounts();
    this.renderHelp();
    this.renderSignature();
    
    // show disasters
    this.updateDisasters(true);
    
    this.loadIntro();
    this.playIntro();
}

World.SVG.prototype.updateQuants = function() {
    var this_ = this;
    
    var quantGDP = d3.scale.quantize()
        .domain([this_.cDataMeta.gdp.binLow, this_.cDataMeta.gdp.binHigh[this_.closeDate[2]]])
        .range(d3.range(this_.binRange).map(function(i) {return "q" + i;}));
    this.quantize = {
        "gdp": quantGDP
    };
    
    this.getQuant = function(d) { return this_.quantize[this_.cData](this_.dataByCC[this_.cData][d.id][this_.closeDate[2]]) };
}

World.SVG.prototype.initData = function() {
    var this_ = this;
        
    var nullC = 0;
    this.countries.forEach(function(d) {
        if (d.id == -99 || d.id == -100) {
            d.id = 1000+(nullC++);
        }
        this_.totCas[d.id] = 0;
    });
    
    this.disasters.sort(function(a,b) {
        // assuming causualtis is always a valid integer
        return parseInt(a.casualty) - parseInt(b.casualty);
    }).reverse();
    
    // format disaster dates
    this.disasters.forEach(function(d, i) {
        var temp = this_.countryData.filter(function(n) {return d.country == n.name;});
        if (temp.length == 1) {
            this_.totCas[temp[0].num] += parseInt(d.casualty);
            if (!this_.totCas[temp[0].num] || this_.totCas[temp[0].num] == undefined)
                this_.totCas[temp[0].num] = 0;
        }
        d.start = formatDate(d.start);
        d.end = formatDate(d.end);
    });
        
    // init country data types
    var totCasByCC = {};
    this.countryData.forEach(function(d) {
        totCasByCC[d.num] = this_.totCas[d.num];
    });
    this.dataByCC = {
        'gdp': this_.gdpByCC,
        'totCas': totCasByCC
    };
    
    var i = 0;
    var aus = 0;
    this.countries.forEach(function(d) {
        d.uid = i++;
        d.selected = false;
        d.blank = "";
        var temp = this_.countryData.filter(function(n) {return d.id == n.num;});
        if (temp.length == 1) {
            d.name = temp[0].name.toTitleCase();
            if (d.id == 36) { aus++; if (aus == 1) d.name = "" }
            d.gdp = addCommas(parseInt(temp[0].gdp));
            d.popDensity = addCommas(parseInt(temp[0].popDensity));
            d.life = addCommas(parseInt(temp[0].life));
            d.totCas = addCommas(parseInt(this_.totCas[temp[0].num]));
            d.bin = {
                'gdp':  this_.quantize['gdp'](this_.dataByCC['gdp'][d.id])
            };
        } else {
            d.name = d.gdp = d.popDensity = "";
            d.bin = {
                'gdp':  "",
                'popDensity': "",
                'life': "",
                'totCas': "",
                'blank': "q-blank"
            };
        }
    });
}

World.SVG.prototype.drawMap = function() {
    var this_ = this;
    
    var width = $(window).width();
    var height = $(window).height();

    var color = d3.scale.category10();

    // set projection
    var factors = {w:width/5.7, h:height/3.2};
    this.scale = Math.min(factors.w, factors.h);
    this.width = this_.scale*5.7;
    this.height = this_.scale*3.2;
    this.mapScale = this_.scale/318;

    this.projection = d3.geo
        .kavrayskiy7()
        .scale(this_.scale)// 1842 x 1019 ~ 320
        .translate([this_.width / 2, this_.height / 2]);    // 895 x 514 ~ 160

    this.path = d3.geo
        .path();
    this.path
        .projection(this_.projection);

    // draw graticules 
    this.graticule = d3.geo.graticule();
    
    d3.select("body")
        .append("div")
        .attr("id", "map")
        .attr("style", "width:"+width+"px; height:"+height+"px;");

    this.svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("style", "position:absolute;")
        
    this.svg.append("svg:g")
        .attr("id", "svg-g")
    
    this.x = (width-this.width)/2;
    this.y = (height-this.height)/2;
    this.g = this.svg.select("g").append("svg:g")
        .attr("transform", "translate("+this_.x+","+this_.y+")");

    this.gPath = this.g.append("path");
    this.gPath
        .datum(this_.graticule.outline)
        .attr("class", "graticule outline")
        .attr("d", this_.path);
}

World.SVG.prototype.redrawMap = function() {
    var this_ = this;
    
    var width = $(window).width();
    var height = $(window).height();

    // set projection
    var factors = {w:width/5.7, h:height/3.2};
    this.scale = Math.min(factors.w, factors.h);
    this.width = this_.scale*5.7;
    this.height = this_.scale*3.2;
    this.mapScale = this_.scale/318;

    this.projection
        .scale(this_.scale)// 1842 x 1019 ~ 320
        .translate([this_.width / 2, this_.height / 2]);    // 895 x 514 ~ 160
    
    d3.select("#map")
        .attr("style", "width:"+width+"px; height:"+height+"px;");

    this.svg
        .attr("width", width)
        .attr("height", height)
        .attr("style", "position:absolute;")
    
    this.x = (width-this.width)/2;
    this.y = (height-this.height)/2;
    this.g
        .attr("transform", "translate("+this_.x+","+this_.y+")");
        
    this.path
        .projection(this_.projection);
    this.gPath
        .attr("d", this_.path);
}
    
World.SVG.prototype.drawCountries = function() {   
    var this_ = this;
    
    this.countries.sort(function(a,b) {
        // assuming causualtis is always a valid integer
        return parseInt(a.id) - parseInt(b.id);
    });
        
    this.g.selectAll(".country").data(this_.countries, function(d) {return d.uid}) 
      .enter().insert("path", ".graticule")
        .attr("d", this_.path)
        .style("fill", function(d) {
            if (this_.dataByCC[this_.cData][d.id]) {
                var s = this_.getQuant(d);
                s = s.substr(1,s.length);
                return (s == "-blank")?"rgb(255,255,255)":this_.binColor[parseInt(s)];
            } else {
                return this_.binColor[0];
            }
        })
        .attr("class", function(d) {return ((this_.dataByCC[this_.cData][d.id])?this_.getQuant(d):"q0")+" country resizeCountry";})
        .attr("id", function(d) {return "country_code_"+d.id});
        this_.g.select('#country_code_10').attr("class", "resizeCountry");
        
    this.g.selectAll("path")
        .on('click', function(d) {
            this_.curCountry = d;
            this_.zoomIn(d, this);
        });
        
    this.g.selectAll('.country-label').data(this_.countries, function(d) {return d.uid})
      .enter().append("text")
        .attr("class", function(d) {return "country-label "+((this_.dataByCC[this_.cData][d.id])?this_.quantize[this_.cData](this_.dataByCC[this_.cData][d.id][this_.closeDate[2]]):"q0")+"-label";})
        .attr("id", function(d) {return d.name.replace(/ /g, "_").replace(/\'/g, "-apos-").replace(/\&/g, "-amp-")+'-label'})
        .attr("transform", function(d) {return "translate("+this_.getCentroid(d, this_.path.centroid(d))+")";})
        .attr("dy", ".35em")
        .text(function(d) {return (d.id<1000)?d.name:"";});
        this_.g.select("#Antarctica-label").remove();

    this.g.insert("path", ".graticule")
        .datum(topojson.mesh(this_.world, this_.world.objects.countries, function(a, b) {return a.id !== b.id;}))
        .attr("class", "country-boundary")
        .attr("d", this_.path);
        
    this.localCData = d3.select("#map")
        .append("div")
        .attr("class", "local-data hidden")
        .attr("id", "local-c-data");
    
    this.localDData = d3.select("#map")
        .append("div")
        .attr("class", "local-data hidden")
        .attr("id", "local-d-data");

    this.g.selectAll(".country").data(this_.countries, function(d) {return d.uid})
        .on("mousemove", function(d) {
            var off = $('#map').offset();
                        
            var mouse = d3.mouse(this_.svg.node()).map( function(d) {return parseInt(d);} );
            
            this_.localCData
              .classed("hidden", false)
              .attr("style", "left:"+Math.min(mouse[0], $('#map').width()-220)+"px;top:"+Math.min(mouse[1], $('#map').height()-80)+"px")
              .html("<b>"+d.name+"</b><br />"+this_.cDataMeta[this_.cData].tooltip+this_.cDataMeta[this_.cData].pre+addCommas(this_.dataByCC[this_.cData][d.id][this_.closeDate[2]])+this_.cDataMeta[this_.cData].suf);
        })
        .on("mouseout",  function(d,i) {            
            this_.localCData.classed("hidden", true);
        });
}

World.SVG.prototype.updateCountries = function(resize) {
    var this_ = this;
    this.g.selectAll(".country")
        .attr("class", function(d) {return ((this_.dataByCC[this_.cData][d.id])?this_.getQuant(d):"q0")+" country resizeCountry";})
        this_.g.select('#country_code_10').attr("class", "resizeCountry");

    this.g.selectAll('.country-label')
        .attr("class", function(d) {return "country-label "+((this_.dataByCC[this_.cData][d.id])?this_.getQuant(d):"q0")+"-label";})
        .attr("transform", function(d) {return "translate("+this_.getCentroid(d, this_.path.centroid(d))+")";});
        
    this.g.selectAll(".country").data(this_.countries, function(d) {return d.uid})
        .on("mousemove", function(d) {                        
            var mouse = d3.mouse(this_.svg.node()).map( function(d) {return parseInt(d);} );
            
            this_.localCData
              .classed("hidden", false)
              .attr("style", "left:"+Math.min(mouse[0], $('#map').width()-220)+"px;top:"+Math.min(mouse[1], $('#map').height()-80)+"px")
              .html("<b>"+d.name+"</b><br />"+this_.cDataMeta[this_.cData].tooltip+this_.cDataMeta[this_.cData].pre+addCommas(this_.dataByCC[this_.cData][d.id][this_.closeDate[2]])+this_.cDataMeta[this_.cData].suf);
        })
        .on("mouseout",  function(d,i) {            
            this_.localCData.classed("hidden", true);
        });
    
    if (resize) {
        this.g.selectAll(".resizeCountry")
            .attr("d", this_.path);
        this.g.selectAll(".country-boundary")
            .attr("d", this_.path);
    }
}

World.SVG.prototype.updateDisasters = function(boot, zoomOut, reload, wipe) {
    var this_ = this;
    
    if (reload) {
        this_.g.selectAll(".disaster-loc, .disaster-label").remove();
    }
    
    this_.disasterSet = [];
    this_.clearCatSubTot();
    this_.disasters.forEach(function(d, i) {
        d.casualty = parseInt(d.casualty);
        if (wipe) {
            this_.disasterSet = [];
        } else {
            // filter casualty range
            if (d.casualty >= this_.minCas && d.casualty <= this_.maxCas) {

                // filter date range
                if (getNumFromDate(d.start) >= getNumFromDate(this_.openDate) && getNumFromDate(d.start) <= getNumFromDate(this_.closeDate)) {

                    // filter casualty type
                    if (this_.filters.length > 0) {
                        this_.filters.forEach(function(f) {
                            if (d.type == f.replace(/-/g, " ")) {

                                // if filtering for country
                                if (this_.cFilter) {

                                    // filter specific country
                                    if (d.country.toUpperCase() == this_.cFilter.toUpperCase()) {
                                        this_.disasterSet.push(d);
                                    }

                                } else {
                                    this_.disasterSet.push(d);
                                    this_.subCatTotSet[d.type] += d.casualty;
                                }
                            }
                        });
                    }
                }
            }
        }
    });
    
    this.updateTotCasCounts();
        
    this_.disasterOb = this_.g.selectAll(".disaster-loc").data(this_.disasterSet, function(d) {return d.uid});
    this_.disasterOb.exit().remove();
    this_.disasterOb.enter().append("svg:circle")
        .attr("class", function(d) {return "disaster-loc "+d.type.replace(/ /g, "-").toLowerCase()+"-loc"})
        .attr("cx", function(d) {return this_.projection([d.lng, d.lat])[0]})
        .attr("cy", function(d) {return this_.projection([d.lng, d.lat])[1]})
        .transition().duration(800)
        .attr("r", function(d) {return this_.circleScale(d.casualty);});
        
    this_.g.selectAll(".disaster-loc")
        .attr("style", "stroke-width:"+(1/this_.zoomSF)+"px");
    if (zoomOut) {
        this_.g.selectAll(".disaster-loc")
            .transition().duration(800)
            .attr("style", "stroke-width:"+(1/this_.zoomSF)+"px")
            .attr("r", function(d) {return this_.circleScale(d.casualty);});
    }
    
    this_.disasterLabels = this_.g.selectAll('.disaster-label').data(this_.disasterSet, function(d) {return d.uid});
    this_.disasterLabels.exit().remove();
    this_.disasterLabels.enter().append("text")
        .attr("class", function(d) {return "hidden disaster-label "+d.type.replace(/ /g, "-").toLowerCase()+"-loc"})
        //.attr("id", function(d) {return })
        .attr("dx", function(d) {return this_.projection([d.lng, d.lat])[0]})
        .attr("dy", function(d) {return this_.projection([d.lng, d.lat])[1]})
        .transition().duration(800)
        .attr("dy", function(d) {return this_.projection([d.lng, d.lat])[1]+this_.circleScale(d.casualty)})
        .text(function(d) {return addCommas(d.casualty);});
        
    this_.disasterOb.on("mousemove", function(d,i) {            
            var mouse = d3.mouse(this_.svg.node()).map( function(d) {return parseInt(d);} );

            this_.localDData
                .attr("style", "left:"+Math.min(mouse[0], $('#map').width()-250)+"px;top:"+Math.min(mouse[1], $('#map').height()-200)+"px")
                .classed("hidden", false);
            if (d.uid != this_.curLocHover) {
                var waiting = true;
                var loading = '<img src="css/images/loading.gif" style="vertical-align:middle" /> ';
                if (d.loc != "middle") {
                    this_.getDisasterLoc(d);
                } else {
                    waiting = false;
                }
                this_.curLocHover = d.uid;
                this_.localDData
                    .html(
                          ((d.name)? "<em>"+d.name+"</em>" : "")+
                          '<div class="casualty-data"><div class="focus">'+addCommas(d.casualty)+'</div><span class="subdue">Casualties</span></div>'+ 
                          ((d.subType)? "<b>"+d.subType+" "+((d.type=="Transportation")?d.type:"")+"</b><br />" : "<b>"+d.type+"</b> <br />")+
                          getReadableDate(d.start)+
                          ((getReadableDate(d.end) != getReadableDate(d.start))?" - "+getReadableDate(d.end):"")+"<br />"+
                          '<span id="disaster-subLoc">'+((waiting)?loading:"")+'</span>'+d.country.toTitleCase()+"<br />"+'<span class="subdue">'+this_.cDataMeta[this_.cData].tooltip+this_.getUnderlyingData(d.country)+'</span>'+"<br />"
                         );
            }
        })
        .on("mouseout",  function(d,i) {
            this_.localDData.classed("hidden", true)
        })
        .on("click", function() {
            var id = $('#disaster-country-id').html();
            var data = $('#country_code_'+id)[0]["__data__"];
            this_.curCountry = data;
            this_.zoomIn(data, d3.select('#country_code_'+id)[0][0]);
        });
        
    if (boot) {
        d3.selectAll('.country-boundary, .country')
            .attr("style", "stroke-width:"+(.5/this_.zoomSF)+"px");
    } else {
        d3.selectAll('.country-boundary, .country')
            .transition()
            .attr("style", "stroke-width:"+(.5/this_.zoomSF)+"px");
    }
}

World.SVG.prototype.circleScale = function(d) {
    return Math.max(Math.pow(d, .398)*this.mapScale, 3*this.mapScale)/Math.sqrt(this.zoomSF);
}
World.SVG.prototype.getUnderlyingData = function(country) {
    var this_ = this;
    var temp = this.countryData.filter(function(n) {return country == n.name;});
    if (temp.length == 1) {
        return this_.cDataMeta[this_.cData].pre+addCommas(this_.dataByCC[this_.cData][temp[0].num][this_.closeDate[2]])+this_.cDataMeta[this_.cData].suf+'<span id="disaster-country-id" class="hidden">'+temp[0].num+'</span>';
    } else {
        return "";
    }
}

World.SVG.prototype.getCScaleFactor = function(d, box) {
    var this_ = this;
    var sf;
    switch(d.name) {
        case "United States":
            sf = 3;
            break;
        case "Canada":
            sf = 3;
            break;
        case "Russian Federation":
            sf = 2.8;
            break;
        case "New Zealand":
            sf = 6;
            break;
        case "France":
            sf = 6;
            break;
        case "Fiji":
            sf = 7;
            break;
        case "Chile":
            sf = 3.5;
            break;
        case "Argentina":
            sf = 3.5;
            break;
        case "China":
            sf = 3.5;
            break;
        case "Norway":
            sf = 7;
            break;
        default:
            sf = Math.min((this_.width / box.width / 4), 8);
    }
    return sf;
}

World.SVG.prototype.getCentroid = function(d, cent) {
    var this_ = this;
    switch(d.id) {
        case 250:                                       // France
            cent[0] = cent[0]+(this_.scale/300)*26;
            cent[1] = cent[1]-(this_.scale/300)*24;
            break;
        case 242:                                       // Fiji
            cent[0] = cent[0]+(this_.scale/300)*54;
            break;
        case 275:
            cent[1] = cent[1]+(this_.scale/300)*7;
            break;
    }
    return cent;
}

World.SVG.prototype.setWindowHandlers = function() {
    var this_ = this;
    $(document).keyup(function(e) {
        if (e.keyCode == 27) {
            this_.curCountry = null;
            this_.zoomOut();
        }
    });
    $(window).resize(function() {
        if (this_.zoomSF > 1) {
            this_.zoomOut(true);
        } else {
            this_.redrawMap();
            this_.updateCountries(true);
            this_.updateDisasters(null, null, true);
        }
    });
}







//  Google Refine data commands
//  value.parseJson()["results"][0]["geometry"]["location"]["lat"]
//  "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + escape(value.reinterpret("utf-8"),'url') + "&components=country:" + escape(cells["country"].value, 'url')
