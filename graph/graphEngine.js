import { graphConfig } from "./graphConfig.js";

let chart;

export function renderGraph(canvasId, data, title) {
  if (chart) chart.destroy();

  chart = new Chart(
    document.getElementById(canvasId),
    {
      type: "line",
      data: {
        datasets: [{
          label: title,
          data: data,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: graphConfig
    }
  );
}