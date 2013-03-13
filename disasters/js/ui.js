
// (c) 2013 Wiley Bennett
// v 1.1.0
//
// UI render calls and general interaction
// 
// PLAY
//      Intro
// 
// RENDER
//      Binned Country Scale
//      Timespan Slider
//      Casualty Slider
//      Disaster Filter
//      Country Data Window
//      Get Disaster Locaion (retieve.php)
//      Render / Update Totat Casualty Counters
//      Help Windows
//      Zoom in to Country Window
//      Zoom out of Country Window
//      Page Signature


//---------------------------------------------------------------------------------- Binned Country Scale ---------------------------------

World.SVG.prototype.playIntro = function(replay) {
    var this_ = this;
    this.introStep = 0;
    
    // for redoing the intro
    $('.map-box').hide();
    $('#intro-replay').remove();
    $('#loading-screen').show();
    $('#vis-title-box').animate({top:((replay)?"30%":"45%"), left:"50%"});
    
    // initiate
    $('#loading-screen').css({"background-image":"none"});
    $('#vis-title-box').animate({top:"30%"}, function() {
        //$('.vis-intro-disable-screen').show();
        $('.vis-intro-content').html(this_.introSteps.text[0]).fadeIn();
        $('.vis-intro-step-count').html(this_.introStep+1+" / "+(this_.introSteps.text.length));
        $('.vis-intro-next').html("Next &raquo;");
        $('.vis-intro-next, .vis-intro-skip, .vis-intro-step-count').fadeIn();
    });
}

World.SVG.prototype.nextIntroStep = function() {
    var this_ = this;
    if (this_.introStep >= this_.introSteps.text.length-1) {
        $('.vis-intro-next').html("Start &raquo;");
    }
    $('.vis-intro-content').hide().html(this_.introSteps.text[this_.introStep]).fadeIn();
    $('.vis-intro-step-count').html(this_.introStep+1+" / "+(this_.introSteps.text.length));
    var id = this_.introSteps.target[this_.introStep];
    $(id).css({left:"50%", top:"30%", "margin-left":85+this_.introSteps.correction[this_.introStep]+"px", "margin-top":"0px"}).delay(200).fadeIn();
    if (this_.introStep > 1) {
        var pid = this_.introSteps.target[this_.introStep-1];
        var pad = getPadding(pid);
        var targetLoc = [
                            {},
                            {top:"100%", left:"0px", "margin-left":"0px", "margin-top":-$(pid).height()-pad.v+"px", opacity:".3"},
                            {left:"50%", top:"100%", "margin-left":"-220px", "margin-top":-$(pid).height()-pad.v+"px", opacity:".3"},
                            {left:"50%", top:"0px", "margin-left":"-220px", opacity:".3"},
                            {left:"100%", top:"0px", "margin-top":"0px", "margin-left":-$(pid).width()-pad.h+"px", opacity:".3"}
                        ];
        $(this_.introSteps.target[this_.introStep-1]).animate(targetLoc[this_.introStep-1]);
    }
}

World.SVG.prototype.finishIntro = function() {
    var this_ = this;
    $('.intro').hide();
    $('#loading-screen').fadeOut();
    $('#vis-title-box').animate({top:"33px", left:"230px"}, function() {
        setTimeout(function() {
            d3.select("#vis-title-box")
                .append("div")
                .attr("id", "intro-replay")
                .attr("class", "action")
                .attr("style", "margin-top:50px;")
                .html("Replay Intro &nbsp;");
                $('#intro-replay').animate({"margin-top":"5px"});
        }, 500);
    });
    $('.map-box').animate({opacity:"1"});
}

World.SVG.prototype.loadIntro = function() {
    var this_ = this;
    
    this.introSteps = {};
    this.introSteps.text = [
        "Welcome to the global disaster interactive visualization. The following is a brief introduction to the interface.",
        "Select disasters types in the filter box. <br /> <br /><span class=\"subdue\">* Processing and animation will be slower when many disaster types are selected.</span>",
        "View any range of casualties, from 10 to 6,000,000. Slide the handles or click on the values to manually set them.<br /> <br /><span class=\"subdue\">The circle size reflects the number of casualties.</span>",
        "View any timespan between January 1900 and December 2008. Click play to watch animations of disasters over time.<br /> <br />Adjust the animation playback speed with the vertical slider.",
        "The GDP/capita values displayed are from the year that is selected by the handle on the right side of the time slider. The range of the scale updates to reflect the highest earning countries at that time.",
        "And finally, zoom by clicking on individual countries."
    ];
    this.introSteps.target = [
        "",
        "#map-filter-box",
        "#map-casualties-box",
        "#map-time-box",
        "#map-scale-box",
    ];
    this.introSteps.correction = [0,0,0,0,150,0];
    
    $(document).delegate(".vis-intro-next, .vis-intro-skip", "click", function() {
        this_.introStep += 1;
        if ($(this).text() == "Skip")
            this_.introStep = this_.introSteps.text.length;
        if (this_.introStep < this_.introSteps.text.length) {
            this_.nextIntroStep();
        } else {
            $('.map-box').css({opacity:".3"}).show();
            $.each(this_.introSteps.target, function(k,v) {
                var pad = getPadding(v);
                var targetLoc = [
                                    {},
                                    {top:"100%", left:"0px", "margin-left":"0px", "margin-top":-$(v).height()-pad.v+"px"},
                                    {left:"50%", top:"100%", "margin-left":"-220px", "margin-top":-$(v).height()-pad.v+"px"},
                                    {left:"50%", top:"0px", "margin-left":"-220px"},
                                    {left:"100%", top:"0px", "margin-left":"0px", "margin-left":-$(v).width()-pad.h+"px"}
                                ];
                $(v).css(targetLoc[k]);
            });
            this_.finishIntro();
        }
    });
    $(document).delegate("#intro-replay", "click", function() {
        this_.playIntro(true);
    });
}



//---------------------------------------------------------------------------------- Binned Country Scale ---------------------------------

World.SVG.prototype.renderScale = function() {
    var this_ = this;
    d3.select("body")
        .append("div")
        .attr("id", "map-scale-box")
        .attr("class", "map-box");
        //$('#map-scale-box').draggable({distance: 10});
            
    d3.select("#map-scale-box")
        .append("span")
        .attr("class", "map-scale-units");
            
    d3.select("#map-scale-box")
        .append("div")
        .attr("id", "map-scale-picker");
    
    $.each(this_.cDataMeta, function(k,v) {
        d3.select("#map-scale-picker")
            .append("div")
            .attr("id", k+"ID")
            .attr("class", "map-scale-choice")
            .html(v.tooltip.replace(/: /g, ""));
            return false;
    });
    $('#'+this_.cData+"ID").addClass('map-scale-choice-selected');
        
    this.updateScale();
        
    $(document).delegate(".map-scale-bin", "mouseenter", function() {
        this_.curBin = $(this).attr("class");
        this_.curBin = this_.curBin.split(" ");
        this_.curBin = this_.curBin[1];
            
        this_.selCont = [];
            $.each(this_.countries, function(k,v) {
                if (v.bin == this_.curBin)
                    this_.selCont.push(v);
            });    
        
        d3.selectAll('.'+this_.curBin)
            .classed("selected", true);
            
        $('.'+this_.curBin+'-label').show();
            
    });
    
    $(document).delegate(".map-scale-bin", "mouseleave", function() {
        var bin = $(this).attr("class");
        bin = bin.split(" ");
        bin = bin[1];
        d3.selectAll('.'+bin)
            .classed("selected", false);
        $('.country-label').hide();
    });
    
    $(document).delegate(".map-scale-choice", "click", function() {
        $('.map-scale-choice').removeClass('map-scale-choice-selected');
        $(this).addClass('map-scale-choice-selected');
        var cur = $(this).attr("id").replace(/ID/g, "");
        this_.cData = cur;
        this_.updateCountries();
        this_.updateScale();
    });
    
    $(document).delegate("#map-scale-box", "mouseenter mouseleave", function(e) {
        if (e.type === "mouseenter") {
            $(this).find(".map-info-pop").stop(true,true).fadeIn();
        } else {
            $(this).find(".map-info-pop").stop(true).fadeOut();
        }
    });
    
    d3.select("#map-scale-box")
        .append("div")
        .attr("id", "map-scale-info")
        .attr("class", "map-info-pop")
        .html('<div class="uarr"><div class="uarr-fill"></div></div>Hover over scale to highlight the country groups');
}

World.SVG.prototype.updateScale = function() {
    var this_ = this;
    
    d3.selectAll(".map-scale-bin").remove();
    d3.selectAll(".map-scale-value").remove();
    
    d3.select(".map-scale-units").html(this_.cDataMeta[this_.cData].units);
    
    d3.select("#map-scale-box")
        .append("div")
        .attr("class", "map-scale-value map-scale-high")
        .html(addCommas(this_.cDataMeta[this_.cData].binHigh[this_.closeDate[2]]));
    d3.select("#map-scale-box")
        .append("div")
        .attr("class", "map-scale-value map-scale-low")
        .html(addCommas(this_.cDataMeta[this_.cData].binLow));
    
    for (var i=this_.binRange-1; i>=0;i--) {
        var step = (this_.cDataMeta[this_.cData].binHigh[this_.closeDate[2]]-this_.cDataMeta[this_.cData].binLow)/this_.binRange;
        d3.select("#map-scale-box")
            .append("div")
            .attr("class", function(d) {return "map-scale-bin "+((this_.cData!="blank")?("q"+i):"");})
            .attr("title", (addCommas(parseInt(this_.cDataMeta[this_.cData].binLow)+Math.floor(i*step*10)/10))+" - "+(addCommas(parseInt(this_.cDataMeta[this_.cData].binLow)+Math.floor((i+1)*step*10)/10))+(((i+1)==this_.binRange)?"+":""));
    }

}

//---------------------------------------------------------------------------------- Timespan Slider ---------------------------------

World.SVG.prototype.renderTimeSlider = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-time-box")
        .attr("class", "map-box");
        //$('.map-box').draggable({distance: 10});

    d3.select("#map-time-box")
        .append("span")
        .attr("class", "slider-label")
        .text("Timespan");
        
    d3.select("#map-time-box")
        .append("div")
        .attr("id", "map-time-amount");
    
    d3.select("#map-time-box")
        .append("span")
        .attr("id", "map-time-play")
        .attr("class", "action button")
        .attr("title", "Play Time Animation")
        .html(this_.icon.play);
    
    d3.select("#map-time-box")
        .append("span")
        .attr("id", "map-time-reset")
        .attr("class", "action button")
        .html("Reset");
    
    d3.select("#map-time-box")
        .append("div")
        .attr("id", "map-time");
        
    d3.select("#map")
        .append("div")
        .attr("id", "map-time-watermark")
        .attr("style", "font-size:"+($(window).height()/6)+"px");
        
    var svg = d3.select("#map-time-box")
        .append("svg")
        .attr("id", "map-time-scale")
        .attr("width", 440)
        .attr("height", 23);
    var scale = d3.scale.linear()
        .domain([1910, 2000])
        .range([0, 339]);
    var xAxis = d3.svg.axis()
        .scale(scale)
        .orient("bottom")
        .tickSize(3)
        .tickFormat(d3.format("0000"));
    svg.append("g")
        .attr("transform", "translate(53,5)")
        .call(xAxis);
    
    var initSpeed = 2.0;
    this_.animSpeed = getAnimSpeed(initSpeed);
        
    $(function() {
        var ob = {
            range: true,
            min: 1,
            max: 1308,
            step: 1,
            animate: 150,
            values: [getNumFromDate(this_.openDate), getNumFromDate(this_.closeDate)],
            slide: function(event, ui) {
                changeSlide(event, ui);
            },
            change: function(event, ui) {
                changeSlide(event, ui);
            }
        };
        function changeSlide(e, ui) {
            $("#map-time-amount").html(getReadableMY(getDate(ui.values[0]))+"&nbsp; &mdash; &nbsp;"+getReadableMY(getDate(ui.values[1])));
            this_.openDate = getDate(ui.values[0]);
            this_.closeDate = getDate(ui.values[1]);
            this_.updateDisasters();
            this_.updateQuants();
            this_.updateScale();
            this_.updateCountries();
            if (this_.zoomSF > 1) {
                $('.disaster-label').css({"font-size":14/this_.zoomSF+"px", "alignment-baseline":"middle"});
                $('.disaster-label').css({"alignment-baseline":"baseline"});
            }
            if (this_.curCountry)
                this_.showCountryWindow(this_.curCountry);
        }
        
        $("#map-time").slider(ob);
        $("#map-time-amount").html(getReadableMY(this_.openDate)+"&nbsp; &mdash; &nbsp;"+getReadableMY(this_.closeDate));
    });
    
    $(document).delegate('#map-time-play', 'click', function() {
        var tSpan = 5; // years
        
        this_.reset.time.openDate = this_.openDate;
        this_.reset.time.closeDate = this_.closeDate;
        var min = getNumFromDate(this_.openDate),
            max = getNumFromDate(this_.closeDate);
                
        this_.continueAnimation = true;
        if (this_.openDate[2] == 2010) {
            this_.openDate = [1,1,1900];
            this_.closeDate = [this_.openDate[0],this_.openDate[1],this_.openDate[2]+tSpan];
        } else {
            this_.closeDate = [this_.openDate[0],this_.openDate[1],this_.openDate[2]+tSpan];
        }
        var $this = $(this);
        if (!$(this).hasClass("play")) {
            $(this).html(this_.icon.pause).addClass("play");
            $('#map-time-watermark').show();
            this_.playAnimation(min, max);
        } else {
            this_.continueAnimation = false;
        }
    });
    
    $(document).delegate('#map-time-reset', 'click', function() {
        this_.continueAnimation = false;
        $('#map-time').slider("values", [getNumFromDate(this_.reset.time.openDate), getNumFromDate(this_.reset.time.closeDate)]);
    });
    
    d3.selectAll(".ui-slider-handle")
        .append("div")
        .attr("class", "ui-slider-handle-big");
        
    this_.appendAnimSpeedSlider(initSpeed);
        
    $(document).delegate('#map-time-box', 'mouseenter mouseleave', function(e) {
        if (e.type == "mouseenter") {
            $('#map-time-speed-label').stop(true,true).fadeIn(150);
        } else {
            $('#map-time-speed-label').stop(true).fadeOut();
        }
    });
}

World.SVG.prototype.appendAnimSpeedSlider = function(initSpeed) {
    var this_ = this;
    
    d3.select("#map-time-box")
        .append("div")
        .attr("id", "map-time-speed");
        
    $(function() {
        var ob = {
            orientation: "vertical",
            min: 1,
            max: 5,
            step: .1,
            animate: 150,
            value: initSpeed,
            slide: function(event, ui) {
                this_.animSpeed = getAnimSpeed(ui.value);
                $('#map-time-speed-val').html(ui.value*10);
            }
        };
        $("#map-time-speed").slider(ob);
    });
    
    d3.select("#map-time-speed .ui-slider-handle")
        .append("div")
        .attr("class", "ui-slider-handle-big-right")
        .append("div")
        .attr("id", "map-time-speed-label")
        .text("Animation Speed");
    d3.select("#map-time-speed .ui-slider-handle-big-right")
        .append("div")
        .attr("id", "map-time-speed-val")
        .text(initSpeed*10);
}

World.SVG.prototype.playAnimation = function(min, max) {
    var this_ = this;
    setTimeout(function() {
        if (getNumFromDate(this_.closeDate) >= max) {
            this_.continueAnimation = false;
            this_.stopAnimation();
            $('#map-time').slider("values", [min, max]);
            return false;
        } else {
            $('#map-time-watermark').html(this_.closeDate[2]);
            var vals = [getNumFromDate(this_.openDate), getNumFromDate(this_.closeDate)];
            $('#map-time').slider("values", vals);
            d3.selectAll('.disaster-loc')
                .classed("loc-filter-hover", true);
            this_.openDate = getDate(getAnimStep(this_.animSpeed)+getNumFromDate(this_.openDate));
            this_.closeDate = getDate(getAnimStep(this_.animSpeed)+getNumFromDate(this_.closeDate));
        }
        if (this_.continueAnimation) {
            d3.selectAll(".disaster-label").classed("hidden", false);
            this_.playAnimation(min, max);
        } else {
            this_.stopAnimation();
        }
    }, this_.animSpeed);
}

World.SVG.prototype.stopAnimation = function() {
    var this_ = this;
    d3.selectAll(".disaster-label").classed("hidden", true);
    $('#map-time-play').html(this_.icon.play).removeClass("play");
    d3.selectAll('.disaster-loc')
        .classed("loc-filter-hover", false);
    $('#map-time-watermark').html("").hide();
}

//---------------------------------------------------------------------------------- Casualty Slider ---------------------------------

World.SVG.prototype.renderCasualtiesSlider = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-casualties-box")
        .attr("class", "map-box");

    d3.select("#map-casualties-box")
        .append("span")
        .attr("class", "slider-label")
        .text("Casualties");
        
    d3.select("#map-casualties-box")
        .append("div")
        .attr("id", "map-casualties-amount");
    d3.select("#map-casualties-amount")
        .append("input")
        .attr("id", "map-casualties-min")
        .attr("class", "map-casualties-input")
        .attr("action", "0");
    d3.select("#map-casualties-amount")
        .append("span")
        .html("&nbsp; &mdash; &nbsp;");
    d3.select("#map-casualties-amount")
        .append("input")
        .attr("id", "map-casualties-max")
        .attr("class", "map-casualties-input")
        .attr("action", "1");
        
    d3.select("#map-casualties-box")
        .append("div")
        .attr("id", "map-casualties");
    
    $(function() {
        function renderCasVals(min, max) {
            $("#map-casualties-min").val(min);
            $("#map-casualties-max").val(max);
        }
        var ob = {
            range: true,
            min: log10(this_.absMinCas),
            max: log10(6000010),
            step: .00001,
            animate: 200,
            values: [log10(this_.minCas), log10(this_.maxCas)],
            change: function(event, ui) {changeCasSlider(event, ui)},
            slide: function(event, ui) {changeCasSlider(event, ui)}
        };
        function changeCasSlider(event, ui) {
            var val = [Math.pow(10, ui.values[0]), Math.pow(10, ui.values[1])];
            renderCasVals(addCommas(roundTo(val[0])), addCommas(roundTo(val[1])));
            this_.minCas = roundTo(val[0]);
            this_.maxCas = roundTo(val[1]);
            this_.updateDisasters();
        }
        $("#map-casualties").slider(ob);
        renderCasVals(addCommas(this_.minCas), addCommas(this_.maxCas));
    });
    $(document).delegate(".map-casualties-input", "blur", function(e) {
        var min = log10(this_.minCas)+.001,
            max = log10(this_.maxCas)+.001;
        var i = parseInt($(this).attr("action"));
        var val = log10(parseInt($(this).val().replace(/,/g, "")))+.001;
        if (i == 0) {
            if (val) {
                if (val > max) {
                    val = max-.01;
                }
            } else {
                val = min;
            }
        } else {
            if (val) {
                if (val < min) {
                    val = min+.01;
                }
            } else {
                val = max;
            }
        }
        $("#map-casualties").slider("values", i, val);
    });
    $(document).delegate(".map-casualties-input", "focus", function(e) {
        var val = $(this).val().replace(/,/g, "");
        $(this).val(val);
    });
    $(document).delegate(".map-casualties-input", "keydown", function(e) {
        if (e.keyCode == 13) {
            $(this).blur();
        }
    });
}

//---------------------------------------------------------------------------------- Disaster Filter ---------------------------------

World.SVG.prototype.renderFilter = function () {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "map-filter-box")
        .attr("class", "map-box");
        $('#map-filter-box').draggable({
            distance: 50, 
            containment: "parent", 
            axis: "x"
        });
        
    d3.select("#map-filter-box")
        .append("div")
        .attr("class", "map-filter-title")
        .text("Disaster Type");
        
    d3.select("#map-filter-box")
        .append("div")
        .attr("id", "map-filters");
        
    d3.select("#map-filters")
            .append("div")
            .attr("id", "filter-all")
            .attr("class", "action")
            .text(((this_.filters.length == 0)?"Select All":"Clear All"));
            
    this.filterSet.forEach(function(d) {
        d3.select("#map-filters")
            .append("div")
            .attr("class", "map-filter"+(($.inArray(d,this_.filters) >= 0)?" map-filter-checked":""))
            .attr("id", "type-"+d.replace(/ /g, "-"))
            .html(d+'<span class="filter-color clear-back '+(($.inArray(d,this_.filters) >= 0)?"":"hidden")+' '+d.replace(/ /g, "-").toLowerCase()+'-loc">&nbsp;</span>');
    });
    
    d3.selectAll(".map-filter")
        .append("span")
        .attr("class", "filter-tot-count")
        .attr("id", function(d,i) {return "tot-"+this_.filterSet[i].replace(/ /g, "-");});

    $(document).delegate(".map-filter", "click", function() {
        if ($(this).hasClass('map-filter-checked')) {
            $(this).removeClass('map-filter-checked');
            $(this).find('.filter-color').addClass("hidden");
            if (!$('.map-filter').hasClass('map-filter-checked')) {
                $('#filter-all').html("Select All");
            }
        } else {
            $(this).addClass('map-filter-checked');
            $('#filter-all').html("Clear All");
            $(this).find('.filter-color').removeClass("hidden");
        }
        this_.setFilterVals();
        this_.updateDisasters();
    });
    $(document).delegate(".map-filter", "mousemove mouseleave", function(e) {
        if (e.type === 'mousemove') {
            if ($(this).hasClass('map-filter-checked')) {
                $('.filter-color').stop(true).fadeOut();
                $(this).find('.filter-color').removeClass("clear-back").stop(true, true).show();
                d3.selectAll('.disaster-loc')
                    .classed("hidden-loc", true);
                var val = '.'+$(this).attr("id").substr(5).toLowerCase()+'-loc';
                d3.selectAll(val)
                    .classed("loc-filter-hover", true)
                    .classed("hidden-loc", false);
            }
        } else {
            $('.filter-color').stop(true, true).fadeIn();
            $(this).find('.filter-color').addClass("clear-back");
            var val = '.'+$(this).attr("id").substr(5).toLowerCase()+'-loc';
            d3.selectAll(val)
                .classed("loc-filter-hover", false);
            d3.selectAll('.disaster-loc')
                .classed("hidden-loc", false);
        }
    });
    $(document).delegate("#filter-all", "click", function() {
        if ($('.map-filter').hasClass('map-filter-checked')) {
            $(this).html("Select All");
            $('.map-filter').removeClass('map-filter-checked');
            $('.filter-color').addClass("hidden");
            this_.setFilterVals("clear");
        } else {
            $(this).html("Clear All");
            $('.map-filter').addClass('map-filter-checked');
            $('.filter-color').removeClass("hidden");
            this_.setFilterVals("all");
        }
        this_.updateDisasters();
    });
    
    this_.setFilterVals();
}

World.SVG.prototype.setFilterVals = function(filter) {
    var this_ = this;
    this_.filters = [];
    if (filter) {
        if (filter == "all") {
            this_.filters = this_.filterSet;
        }
    } else {
        $('.map-filter-checked').each(function(k,v) {
            var val = $(this).attr("id").substr(5);
            this_.filters.push(val);
        });
    }
}

//---------------------------------------------------------------------------------- Country Data Window ---------------------------------

World.SVG.prototype.renderCountryWindow = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "country-data-box");
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "x")
        .attr("title", "Zoom Out")
        .html('<div class="x-for"></div><div class="x-back"></div>')
        .on("click", function() {
            this_.zoomOut();
        });
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "country-data-title");
        
    d3.select("#country-data-box")
        .append("div")
        .attr("class", "country-data-content")
        .html('<table class="country-data-content-table"></table>');
}

World.SVG.prototype.showCountryWindow = function(c) {
    var this_ = this;
    
    $('#country-data-box').fadeIn();
    $('.country-data-title').html(c.name);
    
    var content = "";
    $.each(this_.cDataMeta, function(k,v) {
        if (k != "blank")
            content += '<tr><td>'+v.tooltip.replace(/: /g, "")+'</td><td>'+v.pre+'<b>'+addCommas(this_.dataByCC[this_.cData][c.id][this_.closeDate[2]])+'</b>'+v.suf+'</td></tr>';
        return false;
    });
    content += '<tr><td>'+this_.cDataMeta.totCas.tooltip.replace(/: /g, "")+'</td><td>'+this_.cDataMeta.totCas.pre+'<b>'+c["totCas"]+'</b>'+this_.cDataMeta.totCas.suf+'</td></tr>';
    
    $('.country-data-content-table').html(content);
}

World.SVG.prototype.hideCountryWindow = function(c) {
    var this_ = this;
    
    $('#country-data-box').hide();
    $('.country-data-title').html("");
    $('.country-data-content-table').html("");
}

//---------------------------------------------------------------------------------- Get Disaster Location Name ---------------------------------

World.SVG.prototype.getDisasterLoc = function(d) {
    var this_ = this;
    var lat = parseFloat(d.lat),
        lng = parseFloat(d.lng);
    var pend = this.pendingLoc = Math.random();
    $.post('retrieve.php', {lat: lat, lng: lng}, function(json) {
        if (pend == this_.pendingLoc) {
            if (json.status == "OK") {
                var set = json.results.splice(json.results.length-2, 1).reverse();
                this_.curLoc = set[0].formatted_address.split(", ")[0]+', ';
                $('#disaster-subLoc').html(this_.curLoc);
            } else {
                $('#disaster-subLoc').html("");
            }
        }
    }, "json");
}

//---------------------------------------------------------------------------------- Render / Update Totat Casualty Counters ---------------------------------

World.SVG.prototype.renderTotCasCounts = function() {
    d3.select("body")
        .append("div")
        .attr("id", "tot-cas-fade");
}

World.SVG.prototype.updateTotCasCounts = function() {
    var this_ = this;
    $.each(this_.subCatTotSet, function(k,v) {
        if (v > 0) {
            $('#tot-'+k.replace(/ /g, "-")).html(addCommas(v));
        } else {
            $('#tot-'+k.replace(/ /g, "-")).html("");
        }
    });
}

World.SVG.prototype.clearCatSubTot = function() {
    var this_ = this;
    $.each(this_.subCatTotSet, function(k,v) {
        this_.subCatTotSet[k] = 0;
    });
}

//---------------------------------------------------------------------------------- Help Windows ---------------------------------

World.SVG.prototype.renderHelp = function() {
    d3.select("body")
        .append("div")
        .attr("id", "esc-zoom-out")
        .html('Press Esc <br /> to zoom out');
}

World.SVG.prototype.showHelp = function() {
    if (!$('#esc-zoom-out').is(':visible'))
        $('#esc-zoom-out').show().css({left: "-200px"}).animate({left:"0px"}).fadeTo("slow", .3);
}

//---------------------------------------------------------------------------------- Zoom In to Individual Country View ---------------------------------

World.SVG.prototype.zoomIn = function(d, self) {
    var this_ = this;
    
    $('.country-label').css("fill", "#666");
    $('.country-label').css("font-size", "9px").hide();
    
    this.showCountryWindow(d);
    d3.selectAll('.country')
        .classed("country-focus", false);
    //d3.select(self).classed("country-focus", true);

    this_.updateDisasters(null, null, null, true);

    var cent = this_.path.centroid(d);
    var box = self.getBBox();
    this_.zoomSF = this_.getCScaleFactor(d, box);
    var zoomX = -(cent[0] - this_.width/2/this_.zoomSF),
        zoomY = -(cent[1] - this_.height/2/this_.zoomSF);
        
    this.g.transition().duration(800)
        .each("end", function() {
            this_.showHelp();
            this_.updateDisasters();
        })
        .attr("transform", "scale(" + this_.zoomSF + ")" +" translate(" + (zoomX+this_.x/this_.zoomSF) + "," + (zoomY+this_.y/this_.zoomSF) + ")");

    d.selected = true;
    $('#'+d.name.replace(/ /g, "_").replace(/\'/g, "-apos-").replace(/\&/g, "-amp-")+'-label').show();
    $('.country-label').css("font-size", 20/this_.zoomSF+"px");

    this_.cFilter = d.name;
}

//---------------------------------------------------------------------------------- Zoom Out of Individual Country View ---------------------------------

World.SVG.prototype.zoomOut = function(resize) {
    var this_ = this;
    //d3.selectAll('.country').classed("country-focus", false);
    this.hideCountryWindow();
    this.g.transition().duration(800)
        .each("end", function() {
            if (resize) {
                this_.redrawMap();
                this_.updateCountries(true);
                this_.updateDisasters(null, null, true);
            }
        })
        .attr("transform", "scale(1) translate("+this_.x+","+this_.y+")");
    $('.country-label').hide();
    $('.country-label').css("fill", "#000");
    $('.country-label').css({"font-size":"9px", "alignment-baseline":"baseline"});
    this_.cFilter = null;
    this_.zoomSF = 1;
    this_.updateDisasters(null, true);
    $('#esc-zoom-out').fadeTo("fast", 1).hide();
}

//---------------------------------------------------------------------------------- Creator's Signature ---------------------------------

World.SVG.prototype.renderSignature = function() {
    var this_ = this;
    
    d3.select("body")
        .append("div")
        .attr("id", "signature")
        .classed("out", true);
    d3.select("#signature")
        .append("span")
        .attr("id", "sources-link")
        .attr("class", "action")
        .html("Sources ");
    d3.select("#signature")
        .append("span")
        .html("&copy; ");
    d3.select("#signature")
        .append("span")
        .attr("id", "portfolio-link")
        .attr("class", "action")
        .html("Wiley Bennett");
    d3.select("#signature")
        .append("div")
        .attr("id", "sources-pop")
        .attr("class", "map-info-pop")
        .classed("hidden", true)
        .classed("out", true)
        .html('Disaster Data: <a href="http://www.emdat.be" target="_blank">EM-DAT</a><br />'+
              'GDP data: <a href="http://www.gapminder.org/world/" target="_blank">Gapminder</a>');
        $('#sources-pop').prepend('<div class="darr"><div class="darr-fill"></div></div>');
    
    $(document).delegate("#portfolio-link", "click", function() {
        window.open("http://w.bmdware.com/portfolio/");
        window.focus();
    });
    
    $(document).delegate("#sources-link", "click", function() {
        d3.select("#sources-pop").classed("hidden", false);
    });
    $(document).delegate("#sources-pop, #signature", "mouseenter mouseleave", function(e) {
        if (e.type === "mouseenter") {
            d3.select("#"+$(this).attr("id")).classed("out", false);
        } else {
            d3.select("#"+$(this).attr("id")).classed("out", true);
        }
    });
    $(document).delegate("body", "click", function() {
        if ($('#sources-pop').hasClass("out") && $('#signature').hasClass("out")) {
            d3.select("#sources-pop").classed("hidden", true);
        }
    });
    
}