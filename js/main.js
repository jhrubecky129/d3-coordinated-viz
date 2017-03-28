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
        .center([-10.91, 39.96])
        .rotate([99.18, 2.73, 0])
        .parallels([29.5, 47.14])
        .scale(1000)
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
        
        //graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        
        //grat background
        var gratBackground = map.append("path")
            .datum(graticule.outline())
            .attr("class", "gratBackground")
            .attr("d", path)
        
        //grat lines
        var gratLines = map.selectAll(".gratLines")
            .data(graticule.lines())
            .enter()
            .append("path")
            .attr("class", "gratLines")
            .attr("d", path);
		
		//translate topojson
		var backgroundStates = topojson.feature(states, states.objects.ne_50m_admin_1_states_provinces_lakes), westernStates = topojson.feature(western, western.objects.ne_50m_admin_1_states_provinces_lakes).features;
        
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