const reds = d3.schemeReds[9]

export function productionsTypePieChart(facts) {
	let productionsTypeDimension = facts.dimension((d) => d.type);
	let productionsGroup = productionsTypeDimension.group()

  let productionsPieChart = dc.pieChart('#pie-chart');

	console.log(productionsPieChart)

  productionsPieChart
    .width(400)
    .height(400)
    .innerRadius(100)
    .dimension(productionsTypeDimension)
    .group(productionsGroup)
    .legend(dc.legend().highlightSelected(true))
    .ordinalColors([reds[6], reds[3]])
    .on("pretransition", function (chart) {
      chart.selectAll("text.pie-slice").text(function (d) {
        return (
          d.data.key +
          "\n" +
          dc.utils.printSingleValue(
            ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100
          ) +
          "%"
        );
      });
    });
}
