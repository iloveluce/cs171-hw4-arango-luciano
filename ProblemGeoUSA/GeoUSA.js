
/**
 * Created by hen on 3/8/14.
 */





var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 1020 - margin.left - margin.right;
var height = 800 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var ddVis = {
    x: 850,
    y: 450,
    width: 350 ,
    height: 200 - 20
}

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:350,
    height:200
})


var x = d3.scale.ordinal()
    .rangeRoundBands([0, ddVis.width], .1);

var y = d3.scale.linear()
    .range([ddVis.height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("right");

    detailVis.append("g")
    .attr("transform", "translate(" + ddVis.width + "," + ddVis.height+ ")");

var canvas = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
    })

var svg = canvas.append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

// declare the tooltip
var tooltip = Tooltip("vis-tooltip", 150)

var projection = d3.geo.albersUsa().translate([width / 2, height / 2]);//.precision(.1);
var path = d3.geo.path().projection(projection);



var dataSet = {};



function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
       
        //console.log(data[0]["USAF"])
        //console.log(completeDataSet[data[1]["USAF"]]);

    
    
    //if(completeDataSet[data.USAF])
    // Domain for Detail Vis, theya are all the same, just using 1
    var keys =Object.keys(completeDataSet[data[1]["USAF"]])
    x.domain(keys.filter(function(d){
        if(d == "sum")
            return null
        else 
            return d;
    }));



    var extentofsum = d3.extent(data, function(d){
       if(completeDataSet[d.USAF])
            return completeDataSet[d.USAF].sum;  
    })

   var temporaryscale = d3.scale.linear()
   .domain(extentofsum)
   .range([3, 6]);

   var color = d3.scale.linear()
   .domain(extentofsum)
   .interpolate(d3.interpolateRgb)
   .range(["yellow", "red"])

    //console.log(min)
        //console.log(completeDataSet)
        svg.selectAll(".stations")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", function(d){

        if(completeDataSet[d.USAF])
            return temporaryscale(completeDataSet[d.USAF].sum)
        else
            return 2;
            //console.log(completeDataSet[d.USAF])
        })
        .attr("transform", function(d) {
        return "translate(" + projection([
        d["ISH_LON(dd)"],
        d["ISH_LAT (dd)"]
         ]) + ")"})
        .style("fill", function(d){

        if(completeDataSet[d.USAF])
            return color(completeDataSet[d.USAF].sum)
        else
            return "gray";
            //console.log(completeDataSet[d.USAF])
        })
       .on("mouseover", showDetails)
       .on("mouseout", hideDetails)
       .on("click", updateDetailVis)



    });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;

		//....
		
        loadStations();

    })

}


d3.json("../data/us-named.json", function(error, data) {

    var usMap = topojson.feature(data,data.objects.states).features

    svg.selectAll(".states").data(usMap)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country")
    .on("click", zoomToBB)

    // see also: http://bl.ocks.org/mbostock/4122298

    loadStats();

    //loadStations();
});



// ALL THESE FUNCTIONS are just a RECOMMENDATION !!!!
var createDetailVis = function(){



}


var updateDetailVis = function(data, name){
  
  if(!completeDataSet[data.USAF])
        return;
  var max = 0;
  
  for( var s in completeDataSet[data.USAF]){
    if( s == "sum")
        continue;
    if(completeDataSet[data.USAF][s] > max)
        max = completeDataSet[data.USAF][s];
  }
  
  y.domain([0, max]);

  detailVis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + ddVis.height + ")")
      .call(xAxis);

  detailVis.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  detailVis.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) {console.log(d); return x(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.rangeBand());
}



// ZOOMING
function zoomToBB(d) {
    
    // Thanks to http://bl.ocks.org/mbostock/2206590
    var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
}

  svg.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  svg.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");


}

function resetZoom() {
    
}
function showDetails(d, i) {

    var content = '<p class="title">' + d.STATION + '</span></p>'
    content += '<p class="main">ID: ' + d.USAF + '</span></p>'
    content += '<hr>'
    content += '<p class="main"> Sum: '
    if(completeDataSet[d.USAF]){
        content += completeDataSet[d.USAF].sum + '</span></p>'
    }
    else{
         content += 'Not Available</span></p>'
    }
    //content += '<p class="main">' + d.commit.author.date + '</span></p>'
    //content += '<p class="main">' + d.branch + '</span></p>'
    tooltip.showTooltip(content,d3.event)

 
}

function hideDetails(d,i) {
    tooltip.hideTooltip()

    // return all link borders to white
    d3.selectAll('.node').style("stroke", '#fff')
}

