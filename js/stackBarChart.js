import { updateMarkers } from './map.js';

import { primaryColor, secondaryColor } from './constants/colors.js';

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

  let yearsAddedStackBarChart = new StackBarChart("#years-release-chart");
  yearsAddedStackBarChart
    .width(800)
    .height(200)
    .margins({ top: 40, right: 50, bottom: 40, left: 50 })
    .dimension(addedYearDimension)
    .group(addedYearTypeCount, "Movie", sel_stack("Movie"))
    .gap(2)
    .x(addedYearScale)
    .elasticY(true)
    .brushOn(true)
    .renderHorizontalGridLines(true)
    .xAxisLabel('Years')
    .yAxisLabel('Total')
    .centerBar(true)
    .ordinalColors([primaryColor, secondaryColor])
    .on("filtered", function (chart, filter) {
      updateMarkers();
    });

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
