
/**
 * Created by hen on 3/8/14.
 */




var  padding = 40;

var margin = {
    top: 50,
    right: 10,
    bottom: 50,
    left: 50
};

var width = 830 - margin.left - margin.right;
var height = 700 - margin.bottom - margin.top;
var centered;

var bbVis = {
    x: 100,
    y: 10,
    w: width - 50,
    h: 300
};

var ddVis = {
    twidth: 380,
    theight: 250,
    width: 350 - padding ,
    height: 250 - 90
}

var detailVis = d3.select("#detailVis").append("svg").attr({
    width:ddVis.twidth,
    height:ddVis.theight
})

var x = d3.scale.ordinal()
    .rangeRoundBands([padding, ddVis.width], .1);

var y = d3.scale.linear()
    .range([ddVis.height, padding   ]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
   .scale(y)
    .orient("right");
    
var keys;

var detailviscreated = false;

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



function loadStations() {
    d3.csv("../data/NSRDB_StationsMeta.csv",function(error,data){
       
    

    // Domain for Detail Vis, theya are all the same, just using 1
     keys =Object.keys(completeDataSet[data[1]["USAF"]]).filter(function(d){
        if(d == "sum")
            return null
        else 
            return d;
    })

   
    x.domain(keys);
 
    var extentofsum = d3.extent(data, function(d){
       if(completeDataSet[d.USAF])
            return completeDataSet[d.USAF].sum;  
    })

   var radiusscale = d3.scale.linear()
   .domain(extentofsum)
   .range([3, 6]);

   var color = d3.scale.linear()
   .domain(extentofsum)
   .interpolate(d3.interpolateRgb)
   .range(["yellow", "red"])

    
    var outsideUS = false;
    svg.selectAll(".stations")
        .data(data)
        .enter()
        .append("circle")
        .attr("transform", function(d) {
        
        var loc = projection([d["ISH_LON(dd)"],d["ISH_LAT (dd)"]])
        if(loc) 
            return "translate(" + loc + ")"
        else {
            console.log('here')
            outsideUS = true;
            return "translate(" + loc + ")";
        }})
        .attr("r", function(d){

        if(completeDataSet[d.USAF])
            return radiusscale(completeDataSet[d.USAF].sum)
        else
            return 2;
        })
        .style("fill", function(d){
        if(completeDataSet[d.USAF])
            return color(completeDataSet[d.USAF].sum)
        else
            return "gray";
        })
       .on("mouseover", showDetails)
       .on("mouseout", hideDetails)
       .on("click", updateDetailVis)
   });
}


function loadStats() {

    d3.json("../data/reducedMonthStationHour2003_2004.json", function(error,data){
        completeDataSet= data;
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

    loadStats();
});




var createDetailVis = function(data, key){


    detailVis.append("g")
          .attr("class", "yaxis axis ")
          .attr("transform", "translate(" + ddVis.width +",0)")
          .call(yAxis);

      

    detailVis.append("g")
        .attr("class", "xaxis axis")
        .attr("transform", "translate(0," + (ddVis.height) + ")")
        .call(xAxis)

         
          
          // rotate label text thanks to http://bl.ocks.org/phoebebright/3061203
    detailVis.selectAll(".xaxis text")  
        .attr("transform", function(d) {
            return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
        });

    detailVis.selectAll(".bar")
        .data(keys)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {return x(d); })
        .attr("y", function(d) { return y(completeDataSet[data.USAF][d]); })
        .attr("height", function(d) { return ddVis.height -  y(completeDataSet[data.USAF][d]); })
        .attr("width", x.rangeBand());


    // title of ddVis graph
    detailVis.append("text")
        .attr("class", "titlegraph")
        .attr("x", (ddVis.width / 2))             
        .attr("y", padding/2 )
        .attr("text-anchor", "middle")  
        .text(data.STATION);

     detailVis.append("text")
        .attr("text-anchor", "middle")  
        .attr("transform", "translate("+ ddVis.twidth  +","+(ddVis.height/2)+")rotate(-90)")  
        .text("Lux (sum over two years)");

    detailVis.append("text")
        .attr("text-anchor", "middle")  
        .attr("transform", "translate("+ ddVis.width/2 +","+(ddVis.theight - padding) +")")  
         .text("Hour of the Day");

    detailviscreated = true;



}


var updateDetailVis = function(data, name){
      
    if(!completeDataSet[data.USAF] && detailviscreated){
        detailVis.selectAll("rect")
            .data(keys)
            .transition()
            .duration(1000)
            .attr("y", ddVis.height)
            .attr("height", 0)

        detailVis.select(".title")
            .transition()
            .text("No Data Available");

        return;
      }
    else if(!completeDataSet[data.USAF])
    {
        return;
    }
    
    
    var max = 0;
  
    for( var s in completeDataSet[data.USAF]){
        if( s == "sum")
            continue;
    if(completeDataSet[data.USAF][s] > max)
        max = completeDataSet[data.USAF][s];
    }
  
    y.domain([0, max]);


    if(!detailviscreated){
        createDetailVis(data, keys);
    }
    else {
    
        detailVis.select(".yaxis")
            .transition()
            .duration(1000)
            .call(yAxis);

        detailVis.selectAll("rect")
            .data(keys)
            .transition()
            .duration(1000)
            .attr("y", function(d) { return y(completeDataSet[data.USAF][d]); })
            .attr("height", function(d) { return ddVis.height -  y(completeDataSet[data.USAF][d]); })

        detailVis.select(".title")
            .transition()
            .text(data.STATION);
    } 
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
    } 
    else {
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


function showDetails(d, i) {

    var content = '<p class="title">' + d.STATION + '</span></p>'
    content += '<p class="main">ID: ' + d.USAF + '</span></p>'
    content += '<hr>'
    content += '<p class="main"> Total Lux: '
    if(completeDataSet[d.USAF]){
        content += completeDataSet[d.USAF].sum + '</span></p>'
    }
    else{
         content += 'Not Available</span></p>'
    }
   
    tooltip.showTooltip(content,d3.event)

 
}

function hideDetails(d,i) {
    tooltip.hideTooltip()
}

