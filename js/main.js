/* Stylesheet by Jacob P. Hrubecky, 2017 */

//set up chloropleth map
function setMap(){
	//use d3 queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv, "injury_related_mortality_per_100000.csv")//load attributes from csv
		.defer(d3.json, "background_nations.topojson")//load background topojson
		.defer(d3.json, "background_states.topojson")//load background states
		.defer(d3.json, "western_states.topojson")//load chloropleth states
		.await(callback);
		
	function callback(error, csvData, nations, states, western){
		console.log(error);
		console.log(csvData);
		console.log(nations);
		console.log(states);
		console.log(western);
		
		//translate to topojson
		
	};	
};

window.onload = setMap();