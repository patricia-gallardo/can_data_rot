document.body.style.overflow = 'hidden';

function makeBubblesContext(_graph) {
    // Set the dimensions and margins of the diagram
    const margin = {top: 0, right: 90, bottom: 30, left: 90};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(850, window.innerHeight - margin.top - margin.bottom);

    const svg = makeSvg(width, height, margin);

    // the data - an object with nodes and links
    const graph = _graph;

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = _graph.links.map(d => ({...d}));
    const nodes = _graph.nodes.map(d => ({...d}));
    graph.links = links
    graph.nodes = nodes

    // values for all forces
    let forceProperties = {
        center: {
            x: 0.5,
            y: 0.5
        },
        charge: {
            enabled: true,
            strength: 200,
            distanceMin: 2,
            distanceMax: 2000
        },
        collide: {
            enabled: true,
            strength: .7,
            iterations: 1,
            radius: 10
        },
        forceX: {
            enabled: false,
            strength: .1,
            x: .5
        },
        forceY: {
            enabled: false,
            strength: .1,
            y: .5
        },
        link: {
            enabled: true,
            distance: 30,
            iterations: 1
        }
    }

    // force simulator
    const simulation = d3.forceSimulation();

    let context = {
        svg: svg,
        graph: graph,
        simulation: simulation,
        forceProperties: forceProperties,
        margin: margin,
        width: width,
        height: height,
        // // svg objects
        // link: {},
        // node: {}
    };

    initializeDisplay(context);
    initializeSimulation(context);

    // update size-related forces
    d3.select(window).on("resize", function () {
        // width = +svg.node().getBoundingClientRect().width;
        // height = +svg.node().getBoundingClientRect().height;
        context.width = window.innerWidth - margin.left - margin.right;
        context.height = Math.min(850, window.innerHeight - margin.top - margin.bottom);
        updateForces(context);
    });

    return context;
}

function makeSvg(width, height, margin) {
// append the svg object to the body of the page
    return d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`)
}

//////////// FORCE SIMULATION ////////////

// set up the simulation and event to update locations after each tick
function initializeSimulation(context) {
    console.log("[initializeSimulation]")
    context.simulation.nodes(context.graph.nodes);
    initializeForces(context);
    context.simulation.on("tick", ticked);

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
        console.log("Tick2")
        context.node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

// add forces to the simulation
function initializeForces(context) {
    console.log("[initializeForces]")
    // add forces and associate each with a name
    context.simulation
        // .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces(context);
}

// apply new force properties
function updateForces(context) {
    console.log("[updateForces]")
    // get each force by name and update the properties
    context.simulation.force("center")
        .x(context.width * context.forceProperties.center.x)
        .y(context.height * context.forceProperties.center.y);
    context.simulation.force("charge")
        .strength(context.forceProperties.charge.strength * context.forceProperties.charge.enabled)
        .distanceMin(context.forceProperties.charge.distanceMin)
        .distanceMax(context.forceProperties.charge.distanceMax);
    context.simulation.force("collide")
        .strength(context.forceProperties.collide.strength * context.forceProperties.collide.enabled)
        .radius(context.forceProperties.collide.radius)
        .iterations(context.forceProperties.collide.iterations);
    context.simulation.force("forceX")
        .strength(context.forceProperties.forceX.strength * context.forceProperties.forceX.enabled)
        .x(context.width * context.forceProperties.forceX.x);
    context.simulation.force("forceY")
        .strength(context.forceProperties.forceY.strength * context.forceProperties.forceY.enabled)
        .y(context.height * context.forceProperties.forceY.y);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    context.simulation.alpha(1).restart();
}


//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay(context) {
    console.log("[initializeDisplay]")

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    context.node = context.svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(context.graph.nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group));

    context.node.append("title")
        .text(d => d.id);

    // Add a drag behavior.
    context.node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) context.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) context.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // visualize the graph
    updateDisplay(context);
}

// update the display based on the forces (but not positions)
function updateDisplay(context) {
    context.node
        .attr("r", context.forceProperties.collide.radius)
}

// convenience function to update everything (run after UI input)
function updateAll(context) {
    updateForces(context);
    updateDisplay(context);
}
