import { updateMarkers } from './map.js';

export function ratingTypeHorizontalBarChart(facts) {
	let ratingTypeDimension = facts.dimension(d => d.rating)
	let ratingTypeDimensionGroup = ratingTypeDimension.group()
	let ratingTypesNames = ratingTypeDimensionGroup.top(Infinity).map(d => d.key)

	let ratingTypeBarChart = dc.rowChart("#rating-type-chart")
	ratingTypeBarChart.width(650)
		.height(350)
		.margins({top: 10, right: 50, bottom: 40, left: 80})
		.labelOffsetX(-5)
		.x(d3.scaleLinear()
					.domain([0, ratingTypeDimensionGroup.top(1)[0].value])
					.range([0, ratingTypeBarChart.effectiveWidth()])
					.clamp(true)
			)
		.on('renderlet', function (chart) {
			chart.selectAll("g.row  text")
				.style("text-anchor", "end")
				.call(function (t) {
					t.each(function (d) {
						var self = d3.select(this);
						var text = self.text();
						if (text.length > 14) {
							self.text('');
							text = text.substring(0, 14) + '..';
							self.text(text);
						}
					})
				});
		})
		.dimension(ratingTypeDimension)
		.group(ratingTypeDimensionGroup)
		.gap(2)
		.title('Total')
		.ordinalColors(['#d62728'])
		.on("filtered", function(chart,filter){
			updateMarkers()
		});
	
	// addXAxis(ratingTypeBarChart, 'Total')
	// addYAxis(ratingTypeBarChart, 'Rating')
	

}

function addXAxis(chartToUpdate, displayText) {
	console.log(chartToUpdate)
	chartToUpdate
		// .selectAll("g.row  text")
		.append("text")
		.attr("class", "x-axis-label")
		.attr("text-anchor", "middle")
		.attr("x", chartToUpdate.width() / 2)
		.attr("y", chartToUpdate.height())
		.text(displayText);
}

function addYAxis(chartToUpdate, displayText) {
	chartToUpdate
		// .selectAll("g.row  text")
		.append("text")
		.attr("class", "y-axis-label")
		.attr("text-anchor", "middle")
		.attr("x", 0)
		.attr("y", chartToUpdate.height()/2)
		.text(displayText);
}