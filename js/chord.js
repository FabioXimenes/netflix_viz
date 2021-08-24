export function chord_diagram(dataset) {
  let width = 500;
  let height = 500;

  let result_genre = getDirectorGenreMatrix(dataset);
  let names = [...result_genre["genres"], "", ...result_genre["directors"], ""];
  let opacityDefault = 0.5; //default opacity of chords
  let respondents = result_genre["respondents"];
  let emptyPerc = 0.4;
  let emptyStroke = Math.round(respondents * emptyPerc);
  let outerRadius = Math.min(width, height) / 2 - 100;
  let innerRadius = outerRadius * 0.95;
  let offset = (Math.PI * (emptyStroke / (respondents + emptyStroke))) / 2;

  //Include the offset in de start and end angle to rotate the Chord diagram clockwise
  let startAngle = (d) => d.startAngle + offset;
  let endAngle = (d) => d.endAngle + offset;

  let arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(startAngle) //startAngle and endAngle now include the offset in degrees
    .endAngle(endAngle);

  let path = d3
    .ribbon()
    .radius(innerRadius)
    .startAngle(startAngle)
    .endAngle(endAngle);

  const svg = d3
    .select("#chord")
    .append("svg")
    .attr("width", 600)
    .attr("height", 600)
    .append("g")
    .attr("transform", "translate(300,300)");

  const chords = chord(result_genre["matrix"]);

  const group = svg.append("g").selectAll("g").data(chords.groups).join("g");

  //////////////////// Draw outer Arcs ///////////////////////
  ////////////////////////////////////////////////////////////
  // add the groups on the inner part of the circle
  group
    .append("path")
    .attr("id", function (d) {
      return "group" + d.index;
    })
    .style("fill", function (d, i) {
      return names[i] === "" ? "none" : "#d62728";
    })
    .style("stroke", function (d, i) {
      return names[i] === "" ? "none" : "#d62728";
    })
    .attr("d", arc)
    .on("mouseover", onMouseOver)
    .on("mouseout", onMouseOut);

  //////////////////// Draw inner chords /////////////////////
  ////////////////////////////////////////////////////////////
  // Add the links between groups
  svg
    .append("g")
    .attr("fill-opacity", 0.67)
    .selectAll("path")
    .data(chords)
    .join("path")
    .attr("class", "chord")
    .attr("stroke", "none")
    .attr("fill", "#C4C4C4")
    .style("opacity", function (d) {
      return names[d.source.index] === "" ? 0 : opacityDefault;
    })
    .attr("d", path);

  ////////////////////// Append names ////////////////////////
  ////////////////////////////////////////////////////////////
  group
    .append("text")
    .each((d) => {
      d.angle = (d.startAngle + d.endAngle) / 2 + offset;
    })
    .attr("dy", ".15em")
    .attr(
      "transform",
      (d) => `
      rotate(${(d.angle * 180) / Math.PI - 90})
      translate(${innerRadius + 26})
      ${d.angle > Math.PI ? "rotate(180)" : ""}
      `
    )
    .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
    .text(function (d, i) {
      return names[i];
    });

    // Hover functions
    function onMouseOver(selected) {
      let selectedIndices = [];
    
      svg
        .selectAll(".chord")
        .filter((d) => d.target.index !== selected.index)
        .style("opacity", function (d) {
          return names[d.source.index] === "" ? 0 : 0.3;
        });
    
      svg
        .selectAll(".chord")
        .filter(function (d) {
          if (d.source.index === selected.index) {
            selectedIndices.push(d.target.index);
            return true;
          } else if (d.target.index === selected.index) {
            selectedIndices.push(d.source.index);
            return true;
          }
          return false;
        })
        .style("fill", "#f55d42");
    
      group.style("opacity", function (d) {
        return selectedIndices.includes(d.index) || d.index === selected.index
          ? 1
          : 0.3;
      });
    }
    
    function onMouseOut() {
      group.style("opacity", 1);
    
      svg
        .selectAll(".chord")
        .style("fill", "#C4C4C4")
        .style("opacity", function (d) {
          return names[d.source.index] === "" ? 0 : opacityDefault;
        });
    }
}





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

let chord = d3
  .chord()
  .padAngle(0.02) // padding between entities (black arc)
  .sortSubgroups(d3.descending)
  .sortChords(d3.descending);
