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
          p.average = parseFloat(p.total / p.count).toFixed(2);
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
          p.average = parseFloat(p.total / p.count).toFixed(2);
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

  // Functions to add x-label & y-label to Row Charts (Unsupported by dc.js)
	var addXLabel = function (chartToUpdate, displayText) {
		var textSelection = chartToUpdate.svg()
			.append("text")
			.attr("class", "x-axis-label-rowBarChart")
			.attr("text-anchor", "middle")
			.attr("x", chartToUpdate.width() / 2)
			.attr("y", chartToUpdate.height() - 10)
			.text(displayText);
		var textDims = textSelection.node().getBBox();
		var chartMargins = chartToUpdate.margins();

		// Dynamically adjust positioning after reading text dimension from DOM
		textSelection
			.attr("x", chartMargins.left + (chartToUpdate.width()
				- chartMargins.left - chartMargins.right) / 2)
			.attr("y", chartToUpdate.height() - Math.ceil(textDims.height) / 2);
	};
	var addYLabel = function (chartToUpdate, displayText) {
		var textSelection = chartToUpdate.svg()
			.append("text")
			.attr("class", "y-axis-label-rowBarChart")
			.attr("text-anchor", "middle")
			.attr("transform", "rotate(-90), translate(0, -85)")
			.attr("x", -chartToUpdate.height() / 2)
			.attr("y", 10)
			.text(displayText);
		var textDims = textSelection.node().getBBox();
		var chartMargins = chartToUpdate.margins();

		// Dynamically adjust positioning after reading text dimension from DOM
		textSelection
			.attr("x", -chartMargins.top - (chartToUpdate.height()
				- chartMargins.top - chartMargins.bottom) / 2)
			.attr("y", Math.max(Math.ceil(textDims.height), chartMargins.left
				- Math.ceil(textDims.height) - 5));
	};

  var barChart = dc.rowChart("#genre-score-bar-chart");
  barChart
    .height(300)
    .width(800)
    .margins({ top: 10, right: 70, bottom: 50, left: 130 })
    .labelOffsetX(-5)
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
    .renderTitle(true)
    .colors(primaryColor)
    .dimension(genreDimension)
    .group(topKScoreGroup)
    .valueAccessor(function (d) {
      return d.value.average;
    })
    .ordering((d) => -d.value.average);

    barChart.xAxis().tickFormat(function (v) {return v + '%';});
    barChart.xAxis().tickValues([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    barChart.on("postRender", function (chart) {
      addXLabel(chart, "Tomatometer Score");
      addYLabel(chart, "Genres");
    });
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
