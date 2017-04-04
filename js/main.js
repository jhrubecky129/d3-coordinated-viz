/* Stylesheet by Jacob P. Hrubecky, 2017 */

//self executing function to move to move to local scope
(function(){
    
//variables for data join
var attrArray = ["2015 Unintentional", "2015 Non-Injury", "2015 Suicide", "2015 Homicide", "2015 Undetermined"];

//initial attr
var expressed = attrArray[0];    

//set up chloropleth map
function setMap(){
    //map frame dimension
    var width = window.innerWidth * 0.5,
        height = 460;
    
    //create new svg container for map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //create albers = area conic proj centerd on western US
    var projection = d3.geoAlbers()
        .center([-10.91, 40.5])
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
        
        //place graticule
        setGraticule(map, path);
		
		//translate topojsons
		var backgroundStates = topojson.feature(states, states.objects.ne_50m_admin_1_states_provinces_lakes), 
            westernStates = topojson.feature(western, western.objects.ne_50m_admin_1_states_provinces_lakes).features;
        
        //variables for data join
        var attrArray = ["2015 Unintentional", "2015 Non-Injury", "2015 Suicide", "2015 Homicide", "2015 Undetermined"];
        
        //initial attr
        var expressed = attrArray[0];
        
        //add backgroundStates to map
        var unitedStates = map.append("path")
            .datum(backgroundStates)
            .attr("class", "unitedStates")
            .attr("d", path);        
        
        //join csv data to geojson enum units
        westernStates = joinData(westernStates, csvData);
        
        //examine results
        console.log(backgroundStates);
        console.log(westernStates);
        
        //create color scale
        var colorScale = makeColorScale(csvData);
        
        //add enum units to map
        setEnumerationUnits(westernStates, map, path, colorScale);
        
        //add coordinated visualization to map
        setChart(csvData, colorScale);
	};	
};//end of setMap
    
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 460;
    
    //create scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([0, chartHeight])
        .domain([0, 105]);
    
    //create a second svg element to hold the bar chart
    var chart  = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    //set bars for each province
    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed];
        })
        .attr("class", function(d){
            return "bars " + d.State; //or name, not sure yet
        })
        .attr("width", chartWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartWidth / csvData.length);
        })
        .attr("height", function(d){
            return yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed]));
        })
        .style("fill", function(d){
            return chloropleth(d, colorScale);
        });
    
    //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
              return a[expressed]-b[expressed];
        })
        .attr("class", function(d){
            return "numbers " + d.State;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / csvData.length;
            return i * fraction + (fraction - 1) / 2;
        })
        .attr("y", function(d){
            return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });
    
    //create dynamic title
    var chartTitle = chart.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + expressed + " deaths in each state");

    var scale = chart.append("text")
        .attr("x", 20)
        .attr("y", 80)
        .attr("class", "chartTitle")
        .text("per 100,000 People");

};    
    
function chloropleth(props, colorScale){
    //make sure attr val is number
    var val = parseFloat(props[expressed]);
    //if attr val exists, assign color, otherwise make grey
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else{
        return "#CCC";
    };
};    
    
function makeColorScale(data){
    var colorClasses = [
        "#fef0d9",
        "#fdcc8a",
        "#fc8d59",
        "#d7301f"
    ];
    
    //color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attr. this method puts equal amount of attrs in each bin
    var domainArray = [];
    for (var i = 0; i < data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    
    /* equal interval color scale
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two value array as scale domain
    colorScale.domain(minmax);
    */
    
    /* Natural Breaks color scale generator
    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);    
    */
    
    return colorScale;
};    
    
function setGraticule(map, path){
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
};
    
function joinData(westernStates, csvData){
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i = 0; i < csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.State; //the csv primary key
        
        for (var a = 0; a < westernStates.length; a++){
            var geojsonProps = westernStates[a].properties; //current region geojson
            var geojsonKey = geojsonProps.name; //geojson primary key
            
            //where primary keys match transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                //assign all attrs and vals
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attr val
                    geojsonProps[attr] = val; //assign attr and val to geojson props
                });
            };
        };
    };
    
    return westernStates;
};

function setEnumerationUnits(westernStates, map, path, colorScale){
    //add westernStates to map
    var westernUS = map.selectAll(".regions")
        .data(westernStates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.State;
        })
        .attr("d", path)
        .style("fill", function(d){
            return chloropleth(d.properties, colorScale);
        });
};    

window.onload = setMap();
})();    