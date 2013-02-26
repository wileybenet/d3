jQuery(document).ready(function() {
    
    d3.select("body")
        .append("div")
        .attr("id", "vis-title-box");
    
    d3.select("#vis-title-box")
        .append("div")
        .attr("id", "vis-title")
        .html('Global Disasters');
        
    d3.select("#vis-title-box")
        .append("div")
        .attr("class", "vis-subtitle")
        .html('of the 20<sup>th</sup> Century');
        
    d3.select("body")
        .append("div")
        .attr("id", "loading-screen")
        .attr("style", "width:"+$(window).width()+"px; height:"+$(window).height()+"px");
    
    queue()
        .defer(d3.json, "data/world.json")
        .defer(d3.csv, "data/country_data.csv")
        .defer(d3.csv, "data/disasters.csv")
        .await(init);
});