/*  Parameters:
    Column2: School ID ex.: ab123
        ab: University ID
        123: FacultyID
        a >= 6: Privately owned
    Column4: Name (University/Faculty)
    Column7: Sum of students
    Column8: Sum of female students
    Column9: Students with Czech citizenship
    Column12: Foreigners
    Column15: Students with interrupted studies
    Column16: ??
    Column17: Self-payers
*/

import jsonData from "/data/data.json" assert { type: 'json' };  //data
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; //d3 library

const maxYear = 2022,
      minYear = 2001,
      yearData = jsonData[maxYear];

// jsonData is full of unnecessary objects that break the code. I SHOULD delete them, however this is easier.
const filteredData = yearData.filter(obj => {
    return obj && obj.Column2 && obj.Column7 && obj.Column2 != "00000" && obj.Column2 != "60000" && obj.Column2 != "10000";
  });

// Create an object to store the highest "Column7" values for each prefix
const highestValues = {};
console.log(filteredData);
// Iterate over each object in the data
filteredData.forEach(obj => {
  const column2 = obj.Column2;
  const prefix = column2.substring(0, 2);

  // filter out FACULTY DATA
  // Check if the prefix already exists in the highestValues object
  if (!highestValues[prefix]) {
    highestValues[prefix] = obj;
  } else {
    // If the prefix exists, compare the current object's "Column7" value
    // with the stored object's "Column7" value and update if necessary
    if (obj.Column7 > highestValues[prefix].Column7) {
      highestValues[prefix] = obj;
    }
  }
});

// Create a new variable THAT ONLY HAS DATA about UNIVERSITIES
const filteredDataUni = Object.values(highestValues);
console.log(filteredDataUni);

// Buble graph
 
const generateChart = data => {
  const width = window.innerWidth
  const height = window.innerHeight

  const bubble = data =>
    d3
      .pack()
      .size([width, height])
      .padding(3)(d3.hierarchy({ children: data }).sum(d => d.Column7));

  const root = bubble(data);

  const svg = d3.select('#bubble-chart')
    .style('width', width)
    .style('height', height);

  const tooltip = d3.select('.tooltip');

  const simulation = d3.forceSimulation(root.children)
    .force('collide', d3.forceCollide().radius(d => d.r + 1))
    .force("x", d3.forceX(width/2).strength(0.005))
    .force("y", d3.forceY(height/2).strength(0.005))
    .force('charge', d3.forceManyBody().strength(-10))
    .on('tick', ticked)
    .alphaDecay(0);

const drag = d3.drag()
  .on('start', dragStarted)
  .on('drag', dragged)
  .on('end', dragEnded);

  const node = svg
    .selectAll()
    .data(root.children)
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .call(drag);

  const circle = node
    .append('circle')
    .attr('r', d => d.r)
    .attr('class', d => {
      if (parseInt(d.data.Column2.charAt(0)) >= 6) {
        return 'private';
      } else {
        return 'public';
      }
    });

  const label = node
    .append('text')
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .text(d => d.data.Column4.substring(0, d.r / 4))
    .attr('x', 0)
    .attr('y', 0);

    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  function ticked() {
    node.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }
};

const data = filteredDataUni;
generateChart(data);