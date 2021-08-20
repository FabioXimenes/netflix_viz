export function movieDurationGrowthLineChart(facts) {
  let width = 600

	let dateAddedDimension = facts
    .dimension((d) => d.parsedDate)
    .filter((d) => d != null);
  
	let durationPerDateGroup = dateAddedDimension.group().reduceSum(function (d) {
    if (d.parsedDate != null && d.type == "Movie" && d.duration > 0) {
      return d.duration;
    } else {
      return 0;
    }
  });

  let cumulativeGroup = createCumulativeGroup(durationPerDateGroup);

  let xDateAddedScale = d3
    .scaleTime()
    .domain([
      dateAddedDimension.bottom(1)[0].parsedDate,
      dateAddedDimension.top(1)[0].parsedDate,
    ]);

  let durationPerYearLineChart = dc.lineChart("#durationPerYear-line-chart");
  durationPerYearLineChart
    .width(width)
    .height(500)
    .margins({ top: 30, right: 50, bottom: 25, left: 50 })
    .dimension(dateAddedDimension)
    .renderArea(true)
    .x(xDateAddedScale)
    .xUnits(d3.timeDays)
    .elasticY(true)
    .renderHorizontalGridLines(true)
    .legend(
      dc
        .legend()
        .x(width - 200)
        .y(10)
        .itemHeight(13)
        .gap(5)
    )
    .brushOn(false)
    .group(cumulativeGroup, "Minutes")
    .ordinalColors(["#cb181d"]);
}

function createCumulativeGroup(group) {
  /**
   * Aggregate ordered list to produce cumulative sum of its values
   *
   * @param {Array} list
   * @returns {Array}
   */
  function aggregate(list) {
    return list.reduce((acc, item, index) => {
      acc[index] = {
        key: item.key,
        value: item.value + (index > 0 ? acc[index - 1].value : 0),
      };

      return acc;
    }, []);
  }

  // We need only limited set of methods to implement:
  // all(), top(n) and dispose() are enought to draw a chart.
  return {
    all() {
      return aggregate(group.all());
    },

    top(n) {
      return aggregate(group.top(Infinity)).splice(0, n);
    },

    dispose() {
      if (group.dispose) {
        group.dispose();
      }
    },
  };
}
