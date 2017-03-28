/* Stylesheet by Jacob P. Hrubecky, 2017 */

//set up chloropleth map
function setMap(){
    //map frame dimension
    var width = 960,
        height = 460;
    
    //create new svg container for map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //create albers = area conic proj centerd on western US
    var projection = d3.geoAlbers()
        .center([-110.471, 41.432])
        .rotate([-2, 0, 0])
        .parallels([36.5, 45])
        .scale(2500)
        .translate([width / 2, height / 2]);
    
    //create path generator
    var path = d3.geoPath()
        .projection(projection);
    
	//use d3 queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv, "data/injury_related_mortality_per_100000.csv")//load attributes from csv
		.defer(d3.json, "data/background_states.topojson")//load background states
		.defer(d3.json, "data/western_states.topojson")//load chloropleth states
		.await(callback);
		
	function callback(error, csvData, states, western){
		console.log(error);
		console.log(csvData);
		console.log(states);
		console.log(western);
		
		//translate topojson
		var backgroundStates = topojson.feature(states, states.objects.background_states), westernStates = topojson.feature(western, western.objects.western_states).features;
        
        //examine results
        console.log(backgroundStates);
        console.log(westernStates);
        
        //add backgroundStates to map
        var unitedStates = map.append("path")
            .datum(backgroundStates)
            .attr("class", "unitedStates")
            .attr("d", path);
        
        //add westernStates to map
        var westernUS = map.selectAll(".regions")
            .data(westernStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.State;
            })
            .attr("d", path);
	};	
};

window.onload = setMap();