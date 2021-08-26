import { primaryColor } from "./constants/colors.js";

export function genreScoreBarChart(dataset) {
  let new_dataset = splitGenres(dataset);

  let facts = crossfilter(new_dataset);

  let genreDimension = facts.dimension((d) => d.listed_in);
  let scoreGroup = genreDimension.group().reduce(
    function (p, v) {
      if (v.rottentomatoes_audience_score > 0) {
        ++p.count;
        p.total += v.rottentomatoes_audience_score;
        if (p.count == 0) {
          p.average = 0;
        } else {
          p.average = parseInt(p.total / p.count);
        }
      }

      return p;
    },
    function (p, v) {
      if (v.rottentomatoes_audience_score > 0) {
        --p.count;
        p.total -= v.rottentomatoes_audience_score;
        if (p.count == 0) {
          p.average = 0;
        } else {
          p.average = parseInt(p.total / p.count);
        }
      }
      return p;
    },
    function () {
      return {
        count: 0,
        total: 0,
        average: 0,
      };
    }
  );

  let topKScoreGroup = getTops(scoreGroup, 10);

  var barChart = dc.rowChart("#genre-score-bar-chart");
  barChart
    .height(300)
    .width(800)
    .margins({ top: 10, right: 50, bottom: 20, left: 100 })
    .labelOffsetX(-5)
    .x(d3.scaleLinear().domain([0, 110]))

    // .xAxisLabel("Genre")
    // .yAxisLabel("Average")
    .on("renderlet", function (chart) {
      chart
        .selectAll("g.row  text")
        .style("text-anchor", "end")
        .call(function (t) {
          t.each(function (d) {
            var self = d3.select(this);
            var text = self.text();
            if (text.length > 14) {
              self.text("");
              text = text.substring(0, 14) + "..";
              self.text(text);
            }
          });
        });
    })
    .elasticX(true)
    .colors(primaryColor)
    .dimension(genreDimension)
    .group(topKScoreGroup)
    .valueAccessor(function (d) {
      return d.value.average;
    })
    .ordering((d) => -d.value.average);
}

function splitGenres(dataset) {
  let new_dataset = Array();
  dataset.forEach(function (production) {
    let genres = production.listed_in
      .split(",")
      .map(Function.prototype.call, String.prototype.trim);

    for (let i = 0; i < genres.length; i++) {
      if (genres[i] == "Movies") continue;

      let data = production;

      if (genres[i].includes("Anime")) {
        data.listed_in = "Anime";
      } else {
        data.listed_in = genres[i];
      }

      new_dataset.push(data);
    }
  });
  return new_dataset;
}

function getTops(group, k) {
  return {
    all: function () {
      return group.order((d) => d.average).top(k);
    },
  };
}
