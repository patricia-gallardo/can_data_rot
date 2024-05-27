function makeTree(strings) {

    function makeNode(item) {
        const nodeType = {
            name: "",
            children: []
        };
        const node = Object.create(nodeType);
        node.name = item
        node.children = []
        return node
    }

    let nodes = strings
        .map(function (item) {
            return makeNode(item)
        })
        .reverse()

    let treeData = null

    nodes.forEach(function (node) {
        if (treeData) {
            node.children.push(treeData)
            treeData = node
        } else {
            treeData = node
        }
    })

    console.log(JSON.stringify(treeData))
    return treeData;
}

// Assigns parent, children, height, depth
function makeHierarchy(data) {
    let hierarchy = d3.hierarchy(data, function (d) {
        return d.children;
    });
    hierarchy.x0 = height / 2;
    hierarchy.y0 = 0;
    return hierarchy;
}

// Collapse the node and all it's children
function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    }
}

function searchFromNode(childName, current) {
    let nodeName = current.data.name;
    let foundNode = null
    if (nodeName === childName) {
        console.log("[searchFromNode] Found : " + childName)
        foundNode = current
    } else if (current.children) {
        console.log("[searchFromNode] Search children : " + nodeName)
        current.children.forEach(function (child) {
            let node = searchFromNode(childName, child)
            if (node) {
                console.log("[searchFromNode] Forward node from : " + nodeName)
                foundNode = node
            }
        })
    }
    console.log("[searchFromNode] Not found : " + nodeName)
    return foundNode
}

function expand(d) {
    if (d._children) {
        d.children = d._children
        d.children.forEach(expand)
        d._children = null
    } else if (d.children) {
        d.children.forEach(expand)
    }
}

function showChildren(d) {
    d.children = d._children;
    d._children = null;
}

function showAll(itemName, rootNode) {
    console.log("Show all " + itemName)
    expand(rootNode)
    let node = searchFromNode(itemName, rootNode)
    console.log("Show all " + JSON.stringify(node.data.name))
    update(node.parent, rootNode);
}

function getHiddenNode(childName, node) {
    if (node.data.name === childName)
        return [node]
    if (node._children)
        return node._children.flatMap((child) => getHiddenNode(childName, child))
    if (node.children)
        return node.children.flatMap((child) => getHiddenNode(childName, child))
    return []
}

function getVisibleNode(childName, node) {
    if (node.data.name === childName)
        return [node]
    if (node.children)
        return node.children.flatMap((child) => getVisibleNode(childName, child))
    return []
}

function makeTransitions(strings, rootNode) {
    function makeTransition(current, index) {
        return {
            transitionForward: () => addItem(current, rootNode),
            transitionBackward: () => removeItem(current, rootNode),
            index: index
        }
    }

    let _transitions2 = []

    strings.forEach(function (element, index) {
        if (index !== 0) {
            if (index === strings.length - 1) {
                let transition = {
                    transitionForward: () => showAll(element, rootNode),
                    transitionBackward: () => removeItem(element, rootNode),
                    index: index - 1
                }
                _transitions2.push(transition)
            } else {
                let transition = makeTransition(element, index - 1)
                _transitions2.push(transition)
            }
        }
    })

    console.log(_transitions2)
    console.log(JSON.stringify(_transitions2))
    return _transitions2;
}

function hideSubtree(subtree, rootNode) {
    collapse(subtree)
    update(subtree, rootNode);
}

function addItem(childName, rootNode) {
    console.log("Add : " + childName)
    let node = getHiddenNode(childName, rootNode)[0]
    console.log("Show : " + node)
    if (node && node.parent) {
        showChildren(node.parent)
        update(node.parent, rootNode);
    }
}

function removeItem(childName, rootNode) {
    console.log("Remove : " + childName)
    let node = getVisibleNode(childName, rootNode)[0]
    console.log("Hide : " + node)
    if (node && node.parent) {
        hideSubtree(node.parent, rootNode)
    }
}

function update(source, rootNode) {

    // Assigns the x and y position for the nodes
    const treeData = treemap(rootNode);

    // Compute the new tree layout.
    const nodes = treeData.descendants()
    const links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * 180
    });

    // ****************** Nodes section ***************************

    // Update the nodes...
    const node = svg.selectAll('g.node')
        .data(nodes, function (d) {
            return d.id || (d.id = ++idSequence);
        });

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", -20)
        .attr("text-anchor", 'middle')
        .attr("alignment-baseline", 'middle')
        .text(function (d) {
            return d.data.name;
        });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", function (d) {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    const link = svg.selectAll('path.link')
        .data(links, function (d) {
            return d.id;
        });

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function (d) {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o)
        });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
            return diagonal(d, d.parent)
        });

    // Remove any exiting links
    link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

        path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

        return path
    }

// Toggle children on click.
    function click(d) {
        if (d.children) {
            hideSubtree(d, root);
        } else {
            showChildren(d);
            update(d, root);
        }
    }
}