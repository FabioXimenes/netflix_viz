import { updateMarkers } from './map.js';
import { reds } from '../constants/colors.js';

export function productionsTypePieChart(facts) {
	let productionsTypeDimension = facts.dimension((d) => d.type);
	let productionsGroup = productionsTypeDimension.group()

  let productionsPieChart = dc.pieChart('#pie-chart');

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
    })
		.on("filtered", function(chart,filter){
			updateMarkers()
		});
}
