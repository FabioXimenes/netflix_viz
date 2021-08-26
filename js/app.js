import { chord_diagram } from './chord.js';
import { genreScoreBarChart } from './genreScoreBarChart.js';
import { map } from './map.js';
import { movieDurationGrowthLineChart } from './movieDurationGrowthLineChart.js';
import { productionsTypePieChart } from './productionsTypePieChart.js';
import { ratingTypeHorizontalBarChart } from './ratingTypeHorizontalBarChart.js';
import { productionsTypePerYearChart } from './stackBarChart.js';

d3.csv(
  "https://gist.githubusercontent.com/jvictorsouza/081f58b705455c737f818512ce985712/raw/e8bc5c6287f73463a1eba4d2190c085f6c528e2f/netflix_titles_enriched.csv"
).then(function (data) {
  let id = 0;
  let original_dataset = new Array();
  let parseDate = d3.timeParse("%B %d, %Y");

  for (let i = 0; i < data.length; i++) {
    let d = data[i];
    let date_added_array_elements = d.date_added.split(" ");
    let year_added =
      +date_added_array_elements[date_added_array_elements.length - 1];

    if (d.type == "TV Show") {
      var nSeasons = +d.duration.split(" ")[0];

      let sumAudScore = 0.0;
      let sumNAudReviews = 0.0;
      let sumTomatometerScore = 0.0;
      let sumNTomatometerReviews = 0.0;

      for (let j = 0; j < nSeasons; j++) {
        let season = data[i + j];

        sumAudScore += +season["rottentomatoes_audience_score"];
        sumNAudReviews += +season["rottentomatoes_audience_#reviews"];
        sumTomatometerScore += +season["rottentomatoes_tomatometer_score"];
        sumNTomatometerReviews += +season["rottentomatoes_critics_#reviews"];
      }

      i = i + nSeasons - 1;

      sumAudScore /= nSeasons;
      sumNAudReviews /= nSeasons;
      sumTomatometerScore /= nSeasons;
      sumNTomatometerReviews /= nSeasons;

      d["rottentomatoes_audience_score"] = sumAudScore;
      d["rottentomatoes_audience_#reviews"] = sumNAudReviews;
      d["rottentomatoes_tomatometer_score"] = sumTomatometerScore;
      d["rottentomatoes_critics_#reviews"] = sumNTomatometerReviews;
    } else {
      d.duration = +d.duration.split(" ")[0]; // Duration in minutes for movies only
      d["rottentomatoes_audience_score"] = +d["rottentomatoes_audience_score"];
      d["rottentomatoes_audience_#reviews"] = +d["rottentomatoes_audience_#reviews"];
      d["rottentomatoes_tomatometer_score"] = +d["rottentomatoes_tomatometer_score"];
      d["rottentomatoes_critics_#reviews"] = +d["rottentomatoes_critics_#reviews"];
    }

    d.id = id;
    d.parsedDate = parseDate(d.date_added);
    d.year_added = year_added;

    id += 1;
    original_dataset.push(d);
  }

  console.log(original_dataset)

  let facts = crossfilter(original_dataset);

  map(facts, original_dataset)
  productionsTypePerYearChart(facts);
  ratingTypeHorizontalBarChart(facts);
  productionsTypePieChart(facts);
  movieDurationGrowthLineChart(facts);
  chord_diagram(original_dataset);
  genreScoreBarChart(original_dataset);

  dc.renderAll();
});
