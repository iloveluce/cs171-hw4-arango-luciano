/**
 * Created by hen on 3/8/14.
 */

var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};

var width = 960 - margin.left - margin.right;
var height = 700 - margin.bottom - margin.top;



var bbVis = {
    x: 100,
    y: 10,
    w: width - 100,
    h: 300
};

var dataSet = {};

var svg = d3.select("#vis").append("svg").attr({
    width: width + margin.left + margin.right,
    height: height + margin.top + margin.bottom
}).append("g").attr({
        transform: "translate(" + margin.left + "," + margin.top + ")"
    });

// --- this is just for fun.. play arround with it iof you like :)
var projectionMethods = [
    {
        name:"mercator",
        method: d3.geo.mercator().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"equiRect",
        method: d3.geo.equirectangular().translate([width / 2, height / 2])//.precision(.1);
    },{
        name:"stereo",
        method: d3.geo.stereographic().translate([width / 2, height / 2])//.precision(.1);
    }
];
// --- this is just for fun.. play arround with it iof you like :)


var actualProjectionMethod = 0;
var colorMin = colorbrewer.Greens[3][0];
var colorMax = colorbrewer.Greens[3][2];


// declare the tooltip
var tooltip = Tooltip("vis-tooltip", 150)

var path = d3.geo.path().projection(projectionMethods[0].method);





function runAQueryOn(indicatorString) {
    $.ajax({
        url: "http://api.worldbank.org/countries/all/indicators/"+ indicatorString +"?format=jsonP&prefix=Getdata&per_page=800&date=2000", //do something here
        jsonpCallback:'getdata',
        dataType:'jsonp',
        success: function (data, status){
           
          
       var countryvalue = {};   
        var extentofvalues = d3.extent(data[1], function(d){

           if(d.value){

            //fix at least one obvious mistake
            if(d.country.value == "United States")
                d.country.value = "United States of America"
            countryvalue[d.country.value] = d.value;
            return d.value;
           }
                  
        })
        

    var color = d3.scale.linear()
     .domain(extentofvalues)
     .range([colorMin, colorMax])
    

     svg.selectAll(".country")
     .style("fill", function(d){
    if(countryvalue[d.properties.name]){
        console.log(color(countryvalue[d.properties.name]))
        return color(countryvalue[d.properties.name]);
    }
    else{
        return "none"
    }
    })


        }

    });


}


var initVis = function(error, indicators, world){
    
    
 //var world = topojson.feature(world,data.objects.states).features

    svg.selectAll(".countries").data(world.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "country")
    .on("mouseover", showDetails)
    .on("mouseout", hideDetails)


    console.log(indicators);
    console.log(world);

    d3.select("body").append("select")
    .on("change", change)
    .selectAll("option").data(indicators).enter().append("option")
    .attr("value", function(d){ return d.IndicatorCode; }) /* Optional */
    .text(function(d){ return d.IndicatorName; })


function change() {
    var indicator = this.options[this.selectedIndex].value;

    runAQueryOn(indicator);
}
}


// very cool queue function to make multiple calls.. 
// see 
queue()
    .defer(d3.csv,"../data/worldBank_indicators.csv")
    .defer(d3.json,"../data/world_data.json")
    // .defer(d3.json,"../data/WorldBankCountries.json")
    .await(initVis);




// just for fun 
var textLabel = svg.append("text").text(projectionMethods[actualProjectionMethod].name).attr({
    "transform":"translate(-40,-30)"
})

var changePro = function(){
    actualProjectionMethod = (actualProjectionMethod+1) % (projectionMethods.length);

    textLabel.text(projectionMethods[actualProjectionMethod].name);
    path= d3.geo.path().projection(projectionMethods[actualProjectionMethod].method);
    svg.selectAll(".country").transition().duration(750).attr("d",path);
};

d3.select("body").append("button").text("changePro").on({
    "click":changePro
})


function showDetails(d, i) {
    console.log(d)
    var content = '<p class="title">' + d.properties.name + '</span></p>'
 
    tooltip.showTooltip(content,d3.event)

 
}

function hideDetails(d,i) {
    tooltip.hideTooltip()
}












