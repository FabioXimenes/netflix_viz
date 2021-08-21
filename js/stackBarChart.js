const reds = d3.schemeReds[9]

class StackBarChart extends dc.BarChart {
  legendables() {
    const items = super.legendables();
    return items.reverse();
  }
}

export function productionsTypePerYearChart(facts) {
  let addedYearDimension = facts.dimension((d) => d.year_added);
  let addedYearDimensionGroup = addedYearDimension.group();

  let countPerAddedYear = addedYearDimensionGroup
    .all()
    .reduce((obj, item) => ({ ...obj, [item.key]: item.value }), {});

  let yearsAddedList = removeGarbage(countPerAddedYear);
  let addedYearScale = d3.scaleLinear().domain(d3.extent(yearsAddedList));

  let addedYearTypeCount = addedYearDimensionGroup.reduce(
    (p, v) => {
      p[v.type] = (p[v.type] || 0) + 1;
      return p;
    },
    (p, v) => {
      p[v.type] = (p[v.type] || 0) - 1;
      return p;
    },
    () => ({})
  );

//   let rowtip = d3tip()
//     .attr("class", "d3-tip")
//     .offset([-10, 0])
//     .html(function (d) {
//       return d.key + ": " + d.value;
//     });

  let yearsAddedStackBarChart = new StackBarChart("#years-release-chart");
  yearsAddedStackBarChart
    .width(950)
    .height(200)
    .margins({ top: 40, right: 50, bottom: 20, left: 50 })
    .dimension(addedYearDimension)
    .group(addedYearTypeCount, "Movie", sel_stack("Movie"))
    .gap(2)
    .x(addedYearScale)
    .elasticY(true)
    .brushOn(true)
    .renderHorizontalGridLines(true)
    .centerBar(true)
    .ordinalColors([reds[6], reds[3]])
    // .on("filtered", function (chart, filter) {
    //   updateMarkers();
    // });

//   d3.selectAll("#years-release-chart g.row")
//     .call(rowtip)
//     .on("mouseover", rowtip.show)
//     .on("mouseout", rowtip.hide);

    yearsAddedStackBarChart.legend(dc.legend());
    yearsAddedStackBarChart.stack(addedYearTypeCount, 'TV Show', sel_stack('TV Show'));
}

function removeGarbage(countPerAddedYear) {
  delete countPerAddedYear[""];
  delete countPerAddedYear["0"];
  let list = Object.keys(countPerAddedYear);
  list.push("2022");
  return list;
}

function sel_stack(i) {
  return (d) => d.value[i];
}
