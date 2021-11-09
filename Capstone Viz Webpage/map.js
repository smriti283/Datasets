mapboxgl.accessToken = 'pk.eyJ1Ijoic21yaXRpMjgzIiwiYSI6ImNrcjVhN3BiMzBnZmEycW52OWFxcXUzZHAifQ.oyMlJO9J7_e9wBXG9KLNXw';

var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/light-v10', // use a base map without any data
//   style: 'https://studio.mapbox.com/tilesets/smriti283.2cqog2ia/#0.27/0/-74'
  center: [-73.88, 40.68],
  zoom: 10.5,
});

map.on('load', function() {  
  map.addSource('census_id', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/smriti283/Datasets/main/NYCcensus_exploded.json',
//     data: 'https://raw.githubusercontent.com/smriti283/Datasets/main/NYC%20Taxi%20Zones.zip.geojson',
    promoteId: 'census_id',
  });
  
  map.addLayer({
    id: 'census_id',
    source: 'census_id',
    type: 'fill',
    paint: {
      'fill-opacity': 0.8,
      'fill-outline-color': '#444',
      'fill-color': '#007bff',
    },
  });
  
  d3.csv('https://raw.githubusercontent.com/smriti283/Datasets/main/trial8.csv')
    .then(beacons => {
    let data        = beacons.filter(d => d.count>0),
        bybeac      = Array.from(d3.group(data, d => d.uuid).entries()),
        total = bybeac.map(([uuid, group]) => d3.sum(group, d => d.count)),
        uuid =  bybeac.map(d => d[0]),
        byZone = Object.fromEntries(
          bybeac.map(([uuid, group]) => [uuid, Object.fromEntries(
            d3.map(group, d => [d.census_id, +d.count]))]));
//             console.log(bybeac[4][1]);
    
        traces = [{
          x: total,
        y: uuid.map(d => (d.length<20)?d:(d.slice(0,8)+'...')),
          orientation: 'h',
          type: 'bar',
          marker: {
            color: 'LightGray',
            line: {
              color: 'black',
              width: 0.5,
            }
          },
        }],
        layout = {
          title: 'Beacon Signals',
          width: 500,
          xaxis: {
            title: 'Number of beacon signals received',
          },
          margin: {l: 130},
          yaxis: {
            title: {text: 'Beacon UUIDs', standoff: 0},
            ticks: 'outside',
            autorange: 'reversed',
          },
        },
        chart = document.getElementById('chart');

    Plotly.newPlot(chart, traces, layout);
    
    chart.on('plotly_click', event => {
      // In order to change color, we need to update all
      // item colors, and give the specific one a different color
      let uuidhover = event.points[0].pointIndex, // index of the data element
          perTZ = bybeac[uuidhover][1];
//           console.log(perTZ);
      setZone(perTZ);
    });

    function setZone(perTZ) {
      perTZ.forEach(d => {
        map.setFeatureState({
          source: 'census_id',
//          id: bybeac.map(d => d.location_i)
          id: d.census_id,
        },{
          count: +d.count,
        });
      });
      
      let steps  = 7,
          maxV   = d3.max(perTZ.map(d => d.count)),
          domain = d3.range(0, maxV, maxV/steps),
          colors = d3.schemeReds[steps],
          filter = new Array();
//           console.log(colors);
//           console.log(domain.slice(1));
      domain.slice(1).forEach((v, k) => {
        filter.push(['<', ['feature-state', 'count'], v]);
        filter.push(colors[k]);
      });
      filter.push(colors[colors.length-1]);
      filter = [
        'case',
        ['==', ['feature-state', 'count'], null], 'rgba(0,0,0,0)',
        ...filter,
      ];
      map.setPaintProperty('census_id', 'fill-color', filter);
      
    }
    
    
    
  });  
});