import { reds } from '../constants/colors.js';;

var circlesLayer;
var latLongMap;
var datasetLocal;
var idGrouping;
var idDimension;

export function map(facts, dataset) {
  idDimension = facts.dimension((d) => d.id);
  idGrouping = idDimension.group();
  datasetLocal = dataset

  d3.csv(
    "https://raw.githubusercontent.com/google/dspl/master/samples/google/canonical/countries.csv"
  ).then(function (data) {
    latLongMap = new Map();

    data.forEach(function (d) {
      latLongMap.set(d.name, [d.latitude, d.longitude]);
    });

    let map = L.map("mapid").setView([21.511116, -10.671271], 2);
    L.tileLayer(
      "https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianZpY3RvcnNvdXphIiwiYSI6ImNrZ2dzZnpwZTA0MnMycXF5dHk0ZTdweG8ifQ.ZIydKbNs6Ji-_Cligx2uAA",
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 5,
        minZomm: 2,
      }
    ).addTo(map);

    map.on("click", function () {
      idDimension.filterFunction(function (d) {
        return d != null;
      });

    dc.redrawAll();
    });

    circlesLayer = L.layerGroup().addTo(map);
    renderCircles()
  });
}

function countPerCountry() {
  let numbers = {};
  datasetLocal.forEach(function (k) {
    let id = k.id;
    if (idGrouping.all()[id].value > 0) {
      let countries = k.country.split(", ").filter(function (item) {
        return item !== "";
      });
      for (var i = 0; i < countries.length; i++) {
        let country = countries[i].replace(",", "");
        if (Object.keys(numbers).includes(country)) {
          let value = numbers[country][0] + 1;
          let list_id = numbers[country][1].concat(id);
          numbers[country] = [value, list_id];
        } else {
          numbers[country] = [1, [id]];
        }
      }
    }
  });
  return numbers;
}

function maxRadiusValueAccount() {
  let valuesPerCountry = countPerCountry();
  let values = Object.values(valuesPerCountry);
  let max = 0;
  for (var i = 0; i < values.length; i++) {
    let value = values[i][0];
    if (value > max) {
      max = value;
    }
  }
  console.log(max);
  return max;
}

function renderCircles() {
  let maxRadiusValue = maxRadiusValueAccount();
  let circleScale = d3
    .scaleLinear()
    .domain([0, maxRadiusValue])
    .range([100000, 800000]);
  let markers = new Map();
  let valuesPerCountry = countPerCountry();
  Object.keys(valuesPerCountry).forEach(function (country) {
    let latLong = latLongMap.get(country);
    if (country == "East Germany" || country == "West Germany") {
      country = "Germany";
    }
    if (latLong != undefined) {
      let circle = L.circle(
        latLong,
        circleScale(valuesPerCountry[country][0]),
        {
          color: colorScaleCircles(valuesPerCountry[country][0]),
          weight: 1,
          fillColor: colorScaleCircles(valuesPerCountry[country][0]),
          fillOpacity: 0.5,
        }
      );
      circle.bindPopup(
        "Country: " + country + "<br>Amount: " + valuesPerCountry[country][0]
      );
      circle.publicid = country; //para a interação na outra direção
      circle.on("click", function (params) {
        updateFilters(country);
      });
      markers.set(country, circle);
      circlesLayer.addLayer(circle); // remover quando dinamizar os dados + ajustar os circlesLayer
    }
  });
}

export function updateFilters(e) {
  let valuesPerCountry = countPerCountry();
  let listFiltered = valuesPerCountry[e][1];

  idDimension.filterFunction(function (d) {
    return listFiltered.includes(d);
  });

  dc.redrawAll();
}

export function updateMarkers() {
  circlesLayer.clearLayers();
  renderCircles();
}

let colorScaleCircles = d3.scaleQuantize().domain([0, 100]).range(reds);
