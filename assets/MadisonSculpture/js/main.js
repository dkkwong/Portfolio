//global variables
var map,
neighborhoodBoudaries,
baseMaps,
overlayMaps,
markerLayer,
dataList; 
var layerGroup = L.layerGroup()
//function to instantiate the Leaflet map
function createMap(){
    
    //tileset from leaflet-extras.github.io/leaflet-providers/preview/
    //base layers
    var Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 1,
        maxZoom: 20,
        ext: 'jpg'
    })
    var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
    
    //overlay layer
    var Stamen_TonerLabels = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.{ext}', {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        ext: 'png'
    })
    //vars to hold bounds
    var southWest = [43.016578, -89.492069],
        northEast = [43.164382, -89.288075],
        bounds = L.latLngBounds(southWest,northEast)
    //create the map
    map = L.map('map', {
        center: [43.075, -89.41],
        zoom: 13,
        minZoom: 13, //constrain zoom so users can't zoom out beyond default
        maxZoom: 17, //constrain zoom so users can only zoom in 2 levels beyond default
        maxBounds: bounds,
        layers: [Stamen_Watercolor,Stamen_TonerLabels], //watercolor is default base layer with labels as overlay
    });

    //scale bar
    L.control.scale({ position: 'bottomright' }).addTo(map);
        
    
    baseMaps = {
        "Watercolor": Stamen_Watercolor,
        "Satellite": Esri_WorldImagery
    };
    overlayMaps = {
        "Labels": Stamen_TonerLabels
    };
    
    getData()
};

function getData(){
    //load the data
    fetch("data/our_boundaries.geojson") //path where data is stored
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            neighborhoodBoundaries= L.geoJson(json);
            overlayMaps.Neighborhood = neighborhoodBoundaries;
            //add layer control
            L.control.layers(baseMaps, overlayMaps,{ position: 'topright' }).addTo(map);
        })

    fetch("data/SculptureData.geojson") //path where data is stored
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var data = json.features //create variable to contain data
            dataList=data
            var layer = L.geoJson(data, { 
                onEachFeature: onEachFeature  //use to bind associated information to each marker as a pop-up
            }).addTo(map);
            markerLayer=layer

            createSequenceControls();
            createSearchBar(data);
            createDropdown(data);
            createReset();
            createFeedback();
            
        })      
};

function onEachFeature(feature, layer) {
    // create html string with all properties
    var popupContent = "";
    var links = "";
    var formattedLinks = "";

    if (feature.properties) {
        //Add image links
        popupContent += '<img class="sculpturePhoto" src="img/sculpturepics/'+feature.properties.Photo+'" width="275px height="350px">'
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            if(property=="Link"){
                links += feature.properties[property];
                //console.log(links)
                if(!links){
                    continue
                }else{
                formattedLinks += "<a href=" + "'" + links + "' target='_blank'>Click here to learn more!" + "</a>";
                //console.log(formattedLinks)
                popupContent += "<p><b>" + property + ": </b> " + formattedLinks + "</p>";                
            }}else if(property=="Photo"){
                continue
            
            }else{
                popupContent += "<p><b>" + property + ": </b> " + feature.properties[property] + "</p>";
            }
        }
        
        
        //bind popup to map, set maxheight to make the popups scrollable instead of taking up the whole screen
        layer.bindPopup(popupContent,{maxHeight:300}).openPopup;
        
        
    };
};

function createSequenceControls(){
    var sequence = document.querySelector('#sequence')
    document.querySelector('#year').insertAdjacentHTML('beforeend','Sculpture older than: 2022')
    //create slider
    sequence.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

    //add skip buttons
    sequence.insertAdjacentHTML('afterbegin', '<button class="step" id="reverse" title="Reverse">-</button>'); 
    sequence.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward">+</button>');
    

    document.querySelector(".range-slider").max = 2022;
    document.querySelector(".range-slider").min = 1892;
    document.querySelector(".range-slider").value = 2022;
    document.querySelector(".range-slider").step = 10;

    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = parseInt(document.querySelector('.range-slider').value);

            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index+=10; //increase year by 10
                //wrap around from first year to last year
                index = index > 2022 ? 1892 : index;
            } else if (step.id == 'reverse'){
                index-= 10; //decrease year by 10
                //wrap around from last year to first year
                index = index < 1892 ? 2022 : index;
            };
            //update slider
        document.querySelector('.range-slider').value = index
        //show year
        document.querySelector('#year').innerHTML='<p>Sculpture older than: ' + index + '</p>'
        updateMarker(index)
        })
    })
    // input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        // get the new index value
        var index = this.value;
        //show year
        document.querySelector('#year').innerHTML='<p>Year:' + index + '</p>'
        updateMarker(index)
    });
};
//function is called when the sequence widget is changed
function updateSearch(value){
    //reset layers to default
    map.removeLayer(markerLayer)
    map.addLayer(markerLayer)
    var coordinateList=[];

    for (var i=0; i<dataList.length; i++){
        //find entries in dataset that match with selected value in the dropdown menu
        if (dataList[i].properties.Name.includes(value)) {
            if (!coordinateList.includes(value))
            coordinateList.push(dataList[i].geometry.coordinates) //store sculpture coordinates that match the input value
        }
    }
    map.eachLayer(function(layer){
        if(layer.options && layer.options.pane === "markerPane"){ //take only the marker layer
            layer.remove() //first remove all markers
            coordinateList.forEach(function(item){  
                if(item[0]===layer['_latlng'].lng)  //check if the longitude values match
            layer.addTo(map)  //add back matching markers
            })
        //when reset button is clicked add back all markers to the map
        document.querySelector('#reset').addEventListener('click',function(){layer.addTo(map)})
        }
    }); 
}


function createSearchBar(data){
    search=document.querySelector('#search')
    //add button
    search.insertAdjacentHTML('beforeend','<input type="text" id="Search" onkeyup="runSearch()" placeholder="Enter sculpture name..."></input>')

    search.insertAdjacentHTML('beforeend','<ul id=menu></ul>') //create unordered list
    
    for (var i=0; i<data.length; i++){
        var name = data[i].properties.Name
        //add sculpture names to list
        document.querySelector('ul').insertAdjacentHTML('beforeend','<li class="name">' + name + '</li>')

    }
};
//function is called when you type into the search bar
function runSearch() {
    var value = document.querySelector('#Search').value;
    // Declare variables
    var input = document.getElementById("Search");
    var filter = input.value.toUpperCase();
    var ul = document.getElementById("menu");
    var li = ul.getElementsByClassName("name");
    // Loop through all list items, and hide those who don't match the search query
    for (var i = 0; i < li.length; i++) { 
        if (li[i].innerHTML.toUpperCase().includes(filter)) {
            li[i].style.display = "block";
        } else {
            li[i].style.display = "none";
        }
    }
    //event listener to hide search menu
    document.querySelector('#menu').addEventListener('click',function(event){
        document.querySelectorAll(".name").forEach(function(item){
            item.style.display = "none";
        })
    })
    if (!value){
        document.querySelectorAll(".name").forEach(function(item){
            item.style.display = "none";
        })
    }
    //add event listener when an item in the search menu is clicked
    document.querySelector('#menu').addEventListener('click',function(event){
        value =event.target.innerText
        //pass the clicked text into the update marker function
        updateSearch(value)
    })
}

function createDropdown(data){
    
    var materialList=[];
    var neighborhoodList=[];
    var artistList=[];
    for (var i=0; i<data.length; i++){
        //create  list of materials
         var material = data[i].properties.Material
         if (!materialList.includes(material))
            materialList.push(material)
        //create list of neighborhoods
         var neighborhood = data[i].properties.Neighborhood
         if (!neighborhoodList.includes(neighborhood))
            neighborhoodList.push(neighborhood)
        //create list of artists
         var artist = data[i].properties.Artist
         if (!artistList.includes(artist))
            artistList.push(artist)
    }
    //add dropdown menu
    material=document.querySelector('#dropdown')
    material.insertAdjacentHTML('beforeend','<select name="material" id="material"><option value="" selected="selected">Choose Material</option></select>')
    
    for (i in materialList){
    document.querySelector('#material').insertAdjacentHTML('beforeend','<option class="material-option">' + materialList[i] + '</option>')
    }

    neighborhood=document.querySelector('#dropdown')
    neighborhood.insertAdjacentHTML('beforeend','<select name="neighborhood" id="neighborhood"><option value="" selected="selected">Choose Neighborhood</option></select>')

    for (i in neighborhoodList){
        document.querySelector('#neighborhood').insertAdjacentHTML('beforeend','<option class="neighborhood-option" >' + neighborhoodList[i] + '</option>')
   }

    artist=document.querySelector('#dropdown')
    artist.insertAdjacentHTML('beforeend','<select name="artist" id="artist"><option value="" selected="selected">Choose Artist</option></select>')

    for (i in artistList){
        document.querySelector('#artist').insertAdjacentHTML('beforeend','<option class="artist-option">' + artistList[i]+ '</option>')  
   }
   //add event listener to all dropdown menu options
    document.querySelector('#material').addEventListener("change",updateMarker)
    document.querySelector('#neighborhood').addEventListener("change",updateMarker)
    document.querySelector('#artist').addEventListener("change",updateMarker)
    
    
};

//this function is called when an item in the dropdown menus is clicked
function updateMarker(value){
    //reset layers to default
    map.removeLayer(markerLayer)
    map.addLayer(markerLayer)
    var coordinateList=[];
     //return the current selected value
    material=document.querySelector('#material').value
    neighborhood=document.querySelector('#neighborhood').value
    artist=document.querySelector('#artist').value
    //filter by material
    if (material){
        for (var i=0; i<dataList.length; i++){
            //find entries in dataset that match with selected value in the dropdown menu
            if (dataList[i].properties.Material.includes(material)) {
                if (!coordinateList.includes(material))
            coordinateList.push(dataList[i].geometry.coordinates) //store sculpture coordinates that match the input value
            }
        }  
    }
    //filter by neighborhood
    if (neighborhood){
        for (var i=0; i<dataList.length; i++){
            //find entries in dataset that match with selected value in the dropdown menu
            if (dataList[i].properties.Neighborhood.includes(neighborhood)) {
                if (!coordinateList.includes(neighborhood))
            coordinateList.push(dataList[i].geometry.coordinates) //store sculpture coordinates that match the input value
            }
        }  
    }
    //filter by artist
    if (artist){
        for (var i=0; i<dataList.length; i++){
            //find entries in dataset that match with selected value in the dropdown menu
            if (dataList[i].properties.Artist.includes(artist)) {
                if (!coordinateList.includes(artist))
                coordinateList.push(dataList[i].geometry.coordinates) //store sculpture coordinates that match the input value
            }
        }  
    }
    //filter by name
    if (value){
        for (var i=0; i<dataList.length; i++){
            if(dataList[i].properties.Year==='Unknown'){
                dataList[i].properties.Year=2022 //set unknown years to only show at most recent date
            }
            //find entries in dataset that match with selected value in the dropdown menu
            if (dataList[i].properties.Year<value) {
                if (!coordinateList.includes(value))
                coordinateList.push(dataList[i].geometry.coordinates) //store sculpture coordinates that match the input value
            }
        }  
    }
    map.eachLayer(function(layer){
        if(layer.options && layer.options.pane === "markerPane"){ //take only the marker layer
            layer.remove() //first remove all markers
            coordinateList.forEach(function(item){  
                if(item[0]===layer['_latlng'].lng)  //check if the longitude values match
            layer.addTo(map)  //add back matching markers
            })
        //when reset button is clicked add back all markers to the map
        document.querySelector('#reset').addEventListener('click',function(){layer.addTo(map)})
        }
    });

}

function createReset(){
    feedback=document.querySelector('#reset')
    //add button
    feedback.insertAdjacentHTML('beforeend','<input id="resetButton" type="reset" value="Reset" onClick="reset()"></input>')
}
//function called when reset button is clicked
function reset(){
    document.querySelector("#dropdown").reset();
    document.querySelector(".range-slider").value = 2022;
    document.querySelector('#year').innerHTML='<p>Sculpture older than: ' + 2022 + '</p>'
}

function createFeedback(){
    feedback=document.querySelector('#feedback-container')
    //add button
    feedback.insertAdjacentHTML('beforeend','<button id="feedbackButton" onclick="showFeedback()">Feedback</button>')

    feedbackForm=document.querySelector('#feedbackForm')
    //add form fields
    //still need an image field
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Name" name="name"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Enter Email" name="email"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Name of Sculpture" name="sculptureName"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Location" name="location"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Year Built" name="year"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Artist" name="artist"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Material Type" name="material"></input>')
    feedbackForm.insertAdjacentHTML('beforeend','<input type="text" placeholder="Additional Info" name="other"></input>')
    //add reset button
    feedbackForm.insertAdjacentHTML('beforeend','<button type="reset" class="reset">Reset</button>')
    //add submit button
    feedbackForm.insertAdjacentHTML('beforeend','<button type="submit" class="submit">Submit</button>')
    
}
function showFeedback(){
    //function called when feedback button clicked, shows the feedback form
    document.querySelector("#feedbackForm").style.display = "block"
    //change feedback button to hide 
    document.querySelector('#feedbackButton').innerText="Hide"
    //when clicked, hide the form
    document.querySelector('#feedbackButton').addEventListener('click',function(event){
        document.querySelector("#feedbackForm").style.display = "none"
        document.querySelector('#feedbackButton').innerText="Feedback"
    })
}

document.addEventListener('DOMContentLoaded',createMap)