/* Stylesheet by Jacob P. Hrubecky, 2017 */

//self executing function to move to move to local scope
(function(){
    
//variables for data join
var attrArray = [
    "Malignant Neoplasms", "Diseases of the Heart", "Cerebrovascular Diseases", "Chronic Lower Respiratory Diseases", "Accidents"
];
//initial attr
var expressed = attrArray[0];
//chart frame dimensions
var chartWidth = window.innerWidth * 0.45,
    chartHeight = 460,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([460, 0])
    .domain([-50, 265]);

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
        .center([-7, 41.5])
        .rotate([99.18, 2.73, 0])
        .parallels([29.5, 47.14])
        .scale(950)
        .translate([width / 2, height / 2]);
    
    //create path generator
    var path = d3.geoPath()
        .projection(projection);
    
	//use d3 queue to parallelize asynchronous data loading
	d3.queue()
		.defer(d3.csv, "data/2015_COD.csv")//load attributes from csv
		.defer(d3.json, "data/background_states.topojson")//load background states
		.defer(d3.json, "data/western_states.topojson")//load chloropleth states
		.await(callback);
		
	function callback(error, csvData, states, western){
        
        //place graticule
        //setGraticule(map, path);
		
		//translate topojsons
		var backgroundStates = topojson.feature(states, states.objects.ne_50m_admin_1_states_provinces_lakes), 
            westernStates = topojson.feature(western, western.objects.ne_50m_admin_1_states_provinces_lakes).features;
        
        //add backgroundStates to map
        var unitedStates = map.append("path")
            .datum(backgroundStates)
            .attr("class", "unitedStates")
            .attr("d", path);        
        
        //join csv data to geojson enum units
        westernStates = joinData(westernStates, csvData);
        
        //create color scale
        var colorScale = makeColorScale(csvData);
        
        //add enum units to map
        setEnumerationUnits(westernStates, map, path, colorScale);
        
        //add coordinated visualization to map
        setChart(csvData, colorScale);
        
        createDropdown(csvData);
	};	
};//end of setMap

//create dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");
    
    //add attr name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
    
//change listener handler
function changeAttribute(attribute, csvData){
    //change expressed attr
    expressed = attribute;
    
    //recreate color scale
    var colorScale = makeColorScale(csvData);
    
    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return chloropleth(d.properties, colorScale)
        });
    
    //resort, resize, recolor bars
    var bars = d3.selectAll(".bar")
        //resort
        .sort(function(a,b){
            return a[expressed] - b[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    /*
        .attr("x", function(d,i){
            return i * (chartInnerWidth/csvData.length)+leftPadding;
        })
        //resize
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d,i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor
        .style("fill", function(d){
            return chloropleth(d, colorScale);
        });
    */
    var numbers = d3.selectAll(".numbers")
        .sort(function(a,b){
            return a[expressed] - b[expressed];
        });
    
    var chartTitle = d3.selectAll(".chartTitle")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Deaths Caused By " + expressed);
        
    updateChart(bars, csvData.length, colorScale, numbers, chartTitle);
};

//position size and color barsin chart
function updateChart(bars, n, colorScale, numbers, chartTitle){
    //position bars
    bars
        .attr("x", function(d,i){
            return i * (chartWidth/n);
        })
        //n
        .attr("height", function(d, i){
            return chartHeight-yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d,i){
            return yScale(parseFloat(d[expressed]));
        })
        //recolor
        .style("fill", function(d){
            return chloropleth(d, colorScale);
        });
    
    //annotate bars with attribute value text
    numbers
        .attr("class", function(d){
            return "numbers " + d.name;
        })
        .attr("text-anchor", "middle")
        .attr("x", function(d, i){
            var fraction = chartWidth / n;
            return i * fraction + (chartWidth/n)/2;
        })
        .attr("y", function(d){
            return yScale(parseFloat(d[expressed])) + 15;
        })
        .text(function(d){
            return d[expressed];
        });
    
    //create dynamic title
    /*chartTitle
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + expressed + " deaths in each state");*/
}
    
function setChart(csvData, colorScale){
    
    //create an svg element to hold the bar chart
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
            console.log(d.State)
            return "bar " + d.State; //orname, not sure yet
        })
        .attr("width", chartWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    
    //add style descriptor to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
        /*
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
        */
    
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
        .text(function(d){
            return d[expressed];
        });
    
    var chartTitle = chart.append("text")
        .attr("x", 20)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Deaths Caused By " + expressed);
    
    var scale = chart.append("text")
        .attr("x", 20)
        .attr("y", 80)
        .attr("class", "scale")
        .text("per 100,000 People");
    
    updateChart(bars, csvData.length, colorScale, numbers, chartTitle);
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
    
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.name + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
    
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};    
    
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("."+props.name)
        .style("stroke", "blue")
        .style("stroke-width", "2");
};
    
//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);
        
    //remove info label
    d3.select(".infolabel")
        .remove();

        return styleObject[styleName];
    };
};    

function setEnumerationUnits(westernStates, map, path, colorScale){
    //add westernStates to map
    var westernUS = map.selectAll(".regions")
        .data(westernStates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.name;
        })
        .attr("d", path)
        .style("fill", function(d){
            return chloropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    //add style descriptor to each path
    var desc = westernUS.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');

};    

window.onload = setMap();
})();    