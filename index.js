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
import jsonData from "/grafy/data/data.json" assert {
    type: 'json'
}; //data
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"; //d3v7 library

const maxYear = 2022,
    stackedArea = document.getElementById("stackedArea"),
    bottom = d3.select("#bottom");
const filterUnisByYear = (data, year) => {
    const yearData = data[year];
    // jsonData is full of unnecessary objects that break the code. I SHOULD delete them, however this is easier.
    const filteredData = yearData.filter(obj => {
        return obj && obj.Column2 && obj.Column7 && obj.Column2 != "00000" && obj.Column2 != "60000" && obj.Column2 != "10000";
    });

    // Create an object to store the highest "Column7" values for each prefix
    const highestValues = {};
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
    return Object.values(highestValues);
}

// Buble graph
const generateBubbleChart = data => {
    const width = window.innerWidth - 20
    const height = window.innerHeight - 100

    const bubble = data =>
        d3
        .pack()
        .size([width, height])
        .padding(0)(d3.hierarchy({
            children: data
        })
        .sum(d => d.Column7));

    const root = bubble(data);

    const svg = d3.select('#bubble-chart')
        .style('width', width)
        .style('height', height);

    const tooltip = d3.select('.tooltip');

    const simulation = d3.forceSimulation(root.children)
        .force('collide', d3.forceCollide().radius(d => d.r + 1))
        .force("x", d3.forceX(width / 2).strength(0.01))
        .force("y", d3.forceY(height / 2).strength(0.01))
        .force('charge', d3.forceManyBody().strength(-1))
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
        })
        .on("mouseover", (e, d) => {
            tooltip.select("h2").text(d.data.Column4);
            tooltip.select("span").text(d.data.Column7);
            tooltip.style("visibility", "visible");
        })
        .on('mousemove', e => tooltip.style('top', `${e.pageY}px`)
            .style('left', `${e.pageX + 10}px`)
        )
        .on('mouseout', () => tooltip.style('visibility', 'hidden'))
        .on("dblclick", (e, d) => {
            stackedArea.replaceChildren();
            var fullSchoolID = d.data.Column2;
            var shortSchoolID = fullSchoolID.slice(0, 2);
            var uniData = detailUniData(jsonData, shortSchoolID);
            generateStackedChart(uniData);
            bottom.select("h1").text(d.data.Column4);
            bottom.select("#studentsTotal").text(d.data.Column7);
            bottom.select("#studentsInterrupted").text(d.data.Column15);
            bottom.select("#studentsForeigners").text(d.data.Column12)
            bottom.style("visibility", "visible");
            window.scrollBy({
                top: height,
                left: 0,
                behavior: "smooth",
            });

        })

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

// Data acrobatics to make the stacked area chart working
var faculties = [];
var maxStudents = 0;
const detailUniData = (data, ID) => {
    var FilteredUnformated = {};
    var dataLong = []
    let facultiesUnfiltered = []
    let totalStudents = []
    const parseTime = d3.timeParse("%Y");

    Object.keys(data).forEach(year => {
        // Garbage out
        FilteredUnformated[year] = data[year].filter(obj => {
            return obj && obj.Column2 && obj.Column7 && obj.Column2 != "00000" && obj.Column2 != "60000" && obj.Column2 != "10000";
        });
        //Only selected school with faculties stays
        FilteredUnformated[year] = FilteredUnformated[year].filter(item => item.Column2.startsWith(ID));
        let totalUniData = FilteredUnformated[year].filter(item => item.Column2.endsWith("000"));
        try {
            totalStudents = totalStudents.concat(totalUniData[0].Column7)
        } catch {
            totalStudents.concat(0)
        }
        // If faculties exist, total school information (sum of faculties) is omitted
        if (Object.keys(FilteredUnformated[year]).length > 1) {
            FilteredUnformated[year] = FilteredUnformated[year].filter(item => !item.Column2.endsWith("000"));
        }
        //get all faculty names
        facultiesUnfiltered = facultiesUnfiltered.concat(FilteredUnformated[year].map(obj => obj.Column4));
    })

    // filter duplicate faculty names
    faculties = Array.from(new Set(facultiesUnfiltered));

    // max Students within a year
    maxStudents = d3.max(totalStudents)

    Object.keys(FilteredUnformated).forEach(year => {
        // Create a set of existing faculties in the current year
        const existingFaculties = new Set(FilteredUnformated[year].map(obj => obj.Column4));

        FilteredUnformated[year].forEach(obj => {
            // Extract the faculty name and attendance
            const faculty = obj.Column4;
            const attendance = obj.Column7;

            // Create a new object with year, faculty, and attendance
            dataLong.push({
                year: parseTime(year),
                faculty: faculty,
                attendance: attendance,
            });
        });
        // Check if each faculty exists in the current year, if not, add it with attendance 0
        // Else it breaks area graph
        faculties.forEach(faculty => {
            if (!existingFaculties.has(faculty)) {
                dataLong.push({
                    year: parseTime(year),
                    faculty: faculty,
                    attendance: 0
                });
            }
        });

    })

    // Apparently d3.stack doesn't need data in wide format, however library is so terribly documented that I wasn't aware of it
    // Since it works, there is no need change it
    const dataWide = dataLong.reduce((acc, cur) => {
        if (!acc[cur.year]) {
            acc[cur.year] = {
                year: cur.year
            };
        }
        acc[cur.year][cur.faculty] = cur.attendance;
        return acc;
    }, {});

    // Convert the wide-format data object to an array
    const dataOut = Object.values(dataWide);
    return dataOut
}

// Stack chart
const generateStackedChart = data => {
    const margin = {
            top: 30,
            right: 50,
            bottom: 100,
            left: 100
        };
     let width = 700 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    if (window.innerWidth < 700) {
        width = window.innerWidth - margin.left - margin.right
    }

    const svg = d3.select("#stackedArea")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width])
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(5));

    const y = d3.scaleLinear()
        .domain([0, maxStudents * 1.1])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y))
        .attr("class", "axis");

    // Add X axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height+40 )
    .text("Čas [rok]");

    // Add Y axis label:
    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", -height/2)
    .attr("y", -50 )
    .attr("transform", "rotate(-90)")
    .text("Počet studentů")
    .attr("text-anchor", "start")

    // color palette
    var color = d3.scaleOrdinal()
        .domain(faculties)
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf'])

    const stack = d3.stack()
        .keys(faculties)
    const stackedValues = stack(data);
    console.log(stackedValues)

    // create a tooltip
    var Tooltip2 = svg
        .append("text")
        .attr("x", 15)
        .attr("y", 0)
        .style("opacity", 0)
        .style("font-size", 17)

    // Three functions that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        Tooltip2.style("opacity", 1)
        d3.selectAll(".area").style("opacity", .2)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 1)
    }
    var mousemove = function(d) {
        Tooltip2.text(d.toElement.__data__.key)
    }
    var mouseleave = function(d) {
        Tooltip2.style("opacity", 0)
        d3.selectAll(".area").style("opacity", 1).style("stroke", "none")
    }

    const area = d3.area()
        .x(d => {
            return x(d.data.year)
        })
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
    //.curve(d3.curveCatmullRom);

    svg.selectAll(".area")
        .data(stackedValues)
        .enter()
        .append("path")
        .attr("class", "area")
        .style("fill", d => color(d.key))
        .attr("d", area)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
}

const data = filterUnisByYear(jsonData, maxYear);
generateBubbleChart(data);
