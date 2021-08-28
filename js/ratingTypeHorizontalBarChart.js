import { updateMarkers } from './map.js';

export function ratingTypeHorizontalBarChart(facts) {
	let ratingTypeDimension = facts.dimension(d => d.rating)
	let ratingTypeDimensionGroup = ratingTypeDimension.group()
	let ratingTypesNames = ratingTypeDimensionGroup.top(Infinity).map(d => d.key)

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
			.attr("transform", "rotate(-90), translate(0, -30)")
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

	let ratingTypeBarChart = dc.rowChart("#rating-type-chart")
	ratingTypeBarChart.width(650)
		.height(350)
		.margins({ top: 10, right: 50, bottom: 50, left: 80 })
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
		.on("filtered", function (chart, filter) {
			updateMarkers()
		});

	ratingTypeBarChart.on("postRender", function (chart) {
		addXLabel(chart, "Number of Productions");
		addYLabel(chart, "Rating");
	});


}