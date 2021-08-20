'use strict';

console.log(dc.version)

class StackBarChart extends dc.BarChart {
  legendables () {
    const items = super.legendables();
    return items.reverse();
  }
}

let width = 600;
let height = 600;

let yearsAddedStackBarChart = new StackBarChart("#years-release-chart");
let ratingTypeBarChart = dc.rowChart("#rating-type-chart");
let scoresScatterPlotChart = dc.scatterPlot("#scores-chart");
let durationPerYearLineChart = dc.lineChart("#durationPerYear-line-chart");
let productionsPieChart = dc.pieChart("#pie-chart");

let map = L.map("mapid").setView([21.511116, -10.671271], 2);
L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoianZpY3RvcnNvdXphIiwiYSI6ImNrZ2dzZnpwZTA0MnMycXF5dHk0ZTdweG8ifQ.ZIydKbNs6Ji-_Cligx2uAA",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 21,
    minZomm: 5,
  }
).addTo(map);

// map.on('click', function () {
//   idDimension.filterFunction(function(d) {
//     return d != null;
//   });

d3.csv(
  "https://gist.githubusercontent.com/jvictorsouza/081f58b705455c737f818512ce985712/raw/e8bc5c6287f73463a1eba4d2190c085f6c528e2f/netflix_titles_enriched.csv"
).then(function (data) {
  let id = 0;
  let original_dataset = new Array();
  let parseDate = d3.timeParse("%B %d, %Y");

  for (let i = 0; i < data.length; i++) {
    let d = data[i];
    let date_added_array_elements = d.date_added.split(" ");
    let year_added =
      +date_added_array_elements[date_added_array_elements.length - 1];

    if (d.type == "TV Show") {
      var nSeasons = +d.duration.split(" ")[0];

      let sumAudScore = 0.0;
      let sumNAudReviews = 0.0;
      let sumTomatometerScore = 0.0;
      let sumNTomatometerReviews = 0.0;

      for (let j = 0; j < nSeasons; j++) {
        let season = data[i + j];

        sumAudScore += +season["rottentomatoes_audience_score"];
        sumNAudReviews += +season["rottentomatoes_audience_#reviews"];
        sumTomatometerScore += +season["rottentomatoes_tomatometer_score"];
        sumNTomatometerReviews += +season["rottentomatoes_critics_#reviews"];
      }

      i = i + nSeasons - 1;

      sumAudScore /= nSeasons;
      sumNAudReviews /= nSeasons;
      sumTomatometerScore /= nSeasons;
      sumNTomatometerReviews /= nSeasons;

      d["rottentomatoes_audience_score"] = sumAudScore;
      d["rottentomatoes_audience_#reviews"] = sumNAudReviews;
      d["rottentomatoes_tomatometer_score"] = sumTomatometerScore;
      d["rottentomatoes_critics_#reviews"] = sumNTomatometerReviews;
    } else {
      d.duration = +d.duration.split(" ")[0]; // Duration in minutes for movies only
    }

    d.id = id;
    d.parsedDate = parseDate(d.date_added);
    d.year_added = year_added;

    id += 1;
    original_dataset.push(d);
  }

  let facts = crossfilter(original_dataset);

  let result_genre = getDirectorGenreMatrix(original_dataset);
  let names = [...result_genre['genres'], "", ...result_genre['directors'], ""];
  let opacityDefault = 0.5; //default opacity of chords
  let respondents = result_genre['respondents'];
  let emptyPerc = 0.4;
  let emptyStroke = Math.round(respondents * emptyPerc);
  let outerRadius = Math.min(width, height) / 2  - 100;
  let innerRadius = outerRadius * 0.95;
  let offset = Math.PI * (emptyStroke/(respondents + emptyStroke)) / 2;

  let arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle) //startAngle and endAngle now include the offset in degrees
    .endAngle(endAngle);

  let path = d3.ribbon()
  	.radius(innerRadius)
    .startAngle(startAngle)
  	.endAngle(endAngle);

  ////////////////////////////////////////////////////////////
  ////////////////// Extra Functions /////////////////////////
  ////////////////////////////////////////////////////////////
  //Include the offset in de start and end angle to rotate the Chord diagram clockwise
  function startAngle(d) { return d.startAngle + offset; }
  function endAngle(d) { return d.endAngle + offset; }

  const svg = d3.select("#chord").append("svg")
        .attr("width", 800)
  			.attr("height", 800)
        .append("g")
        .attr("transform", "translate(400,400)"); 
  
  const chords = chord(result_genre['matrix'])

  const group = svg.append('g')
    .selectAll('g')
    .data(chords.groups)
    .join('g')

  function onMouseOver(selected) {    
    let selectedIndices = []

    svg.selectAll(".chord")
      .filter(d => d.target.index !== selected.index)
      .style("opacity", function(d) { return (names[d.source.index] === "" ? 0 : 0.3); })

    svg.selectAll(".chord")
      .filter( 
        function(d) {
          if (d.source.index === selected.index) {
            selectedIndices.push(d.target.index)
            return true
          } else if (d.target.index === selected.index) {
            selectedIndices.push(d.source.index)
            return true
          } 
          return false
        })
      .style('fill', '#f55d42')
  
    group
      .style('opacity', 
        function(d) {
          return selectedIndices.includes(d.index) || d.index === selected.index ? 1 : 0.3
        })
  }

  function onMouseOut() {
    group.style("opacity", 1);
    
    svg.selectAll(".chord")
      .style('fill', '#C4C4C4')
      .style("opacity", function(d) { return (names[d.source.index] === "" ? 0 : opacityDefault); })
  }

  //////////////////// Draw outer Arcs ///////////////////////
  ////////////////////////////////////////////////////////////
  // add the groups on the inner part of the circle
  group.append('path')
    .attr("id", function (d) { return "group" + d.index;})
    .style("fill", function(d,i) { return (names[i] === "" ? "none" : "#d62728"); })
    .style("stroke", function(d,i) { return (names[i] === "" ? "none" : "#d62728"); })
    .attr("d", arc)
    .on("mouseover", onMouseOver)
    .on("mouseout", onMouseOut);

  //////////////////// Draw inner chords /////////////////////
  ////////////////////////////////////////////////////////////  
  // Add the links between groups
  svg.append("g")
      .attr("fill-opacity", 0.67)
    .selectAll("path")
    .data(chords)
    .join("path")
      .attr("class", "chord")
      .attr("stroke", 'none')
      .attr("fill", '#C4C4C4')
      .style("opacity", function(d) { return (names[d.source.index] === "" ? 0 : opacityDefault); })
      .attr("d", path)

  ////////////////////// Append names ////////////////////////
  ////////////////////////////////////////////////////////////
  group.append("text")
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2 + offset; })
    .attr("dy", ".15em")
    .attr("transform", d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${innerRadius + 26})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .text(function(d,i) { return names[i]; });

});

function transpose(m) {
  return m[0].map((x, i) => m.map((x) => x[i]));
}

function getDirectorGenreMatrix(dataset) {
  var directors = {};
  for (let i = 0; i < dataset.length; i++) {
    var production = dataset[i];
    var director = production.director.split(",")[0];

    var genres = production.listed_in
      .split(",")
      .map(Function.prototype.call, String.prototype.trim);
    if (genres[0] != "") {
      if (!(director in directors)) {
        directors[director] = {};
      }

      for (var j in genres) {
        var genre = genres[j];

        if (genre != "International Movies" && genre != "Stand-Up Comedy") {
          if (genre in directors[director]) {
            directors[director][genre] += 1;
          } else {
            directors[director][genre] = 1;
          }
        }
      }
    }
  }

  // Filtra apenas os diretores que selecionaram um ator pelo menos K vezes
  let K = 6;
  for (let i in directors) {
    var genres = directors[i];

    // para cada ator, verifica se o ator aparece mais de pelo menos vezes, se não deleta
    for (let j in genres) {
      var genre = genres[j];
      if (genre < K) {
        delete directors[i][j];
      }
    }

    // verifica se o diretor ainda tem algum ator após a filtragem anterior
    if (Object.keys(directors[i]).length === 0) {
      delete directors[i];
    }
  }

  delete directors[""]; // remove diretor desconhecido -> key = ""

  // Monta a lista com os nomes dos diretores e atores
  let directorsNames = new Array();
  let genresNames = new Array();
  for (let directorName in directors) {
    directorsNames.push(directorName);

    for (let genreName in directors[directorName]) {
      if (!genresNames.includes(genreName.trim())) {
        genresNames.push(genreName.trim());
      }
    }
  }

  // Constroi a matriz básica que representa o fluxo diretor -> ator
  var matrix = Array(directorsNames.length);
  for (let i = 0; i < directorsNames.length; i++) {
    matrix[i] = Array(genresNames.length);
    for (let j = 0; j < genresNames.length; j++) {
      if (genresNames[j] in directors[directorsNames[i]]) {
        matrix[i][j] = directors[directorsNames[i]][genresNames[j]];
      } else {
        matrix[i][j] = 0;
      }
    }
  }

  var transposedMatrix = transpose(matrix);

  // Constroi a matriz final
  var finalMatrix = [];
  for (let i = 0; i < transposedMatrix.length; i++) {
    finalMatrix.push([
      ...Array(genresNames.length).fill(0),
      ...transposedMatrix[i],
    ]);
  }

  for (let i = 0; i < matrix.length; i++) {
    finalMatrix.push([...matrix[i], ...Array(directorsNames.length).fill(0)]);
  }

  var sum = 0;
  for (let i = 0; i < finalMatrix.length; i++) {
    sum += finalMatrix[i].reduce(add, 0);
  }

  // Adiciona o dummy flow
  let pos = transposedMatrix.length;
  finalMatrix.splice(pos, 0, Array(finalMatrix[0].length).fill(0));
  finalMatrix.push(Array(finalMatrix[0].length).fill(0));

  for (let i = 0; i < finalMatrix.length; i++) {
    let pos = matrix[0].length;

    if (i == finalMatrix.length - 1) {
      finalMatrix[i].splice(pos, 0, Math.round(sum * 0.4));
    } else {
      finalMatrix[i].splice(pos, 0, 0);
    }

    if (i == transposedMatrix.length) {
      finalMatrix[i].push(Math.round(sum * 0.4));
    } else {
      finalMatrix[i].push(0);
    }
  }

  return {
    matrix: finalMatrix,
    genres: genresNames,
    directors: directorsNames,
    respondents: sum,
  };
}

function add(accumulator, a) {
  return accumulator + a;
}

let chord = d3.chord()
      .padAngle(0.02)     // padding between entities (black arc)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending)