const jsonData = {
    "categories": [
        {
            "weather": ["sunny", "windy", "rainy"],
            "comfort level": ["good", "medium"],
            "formality": ["formal", "informal"],
            "style": ["business", "sport", "beach"],
            "festival": ["Christmas", "Easter"],
        }
    ]
};
localStorage.setItem('categoryData', JSON.stringify(jsonData));
localStorage.setItem('userInput', 'outfit');

let dish = localStorage.getItem('userInput');
let categories = JSON.parse(localStorage.getItem('categoryData')).categories[0];

function buildHierarchy(categories) {
    let hierarchy = { name: dish, children: [] };
    for (let category in categories) {
        let categoryNode = { name: category, children: categories[category].map(item => ({ name: item, id: item })) };
        hierarchy.children.push(categoryNode);
    }
    return hierarchy;
}

const root = d3.hierarchy(buildHierarchy(categories));

const svg = d3.select("#graph"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

const treeLayout = d3.tree().size([height - 40, width - 180]);
treeLayout(root);

const leftMargin = 80;
const centerPosY = height / 2 - root.x;

const gLink = svg.append("g").attr("transform", `translate(${leftMargin},${centerPosY})`);
const gNode = svg.append("g").attr("transform", `translate(${leftMargin},${centerPosY})`);

const link = gLink.selectAll(".link")
    .data(root.links())
    .enter().append("line")
    .attr("class", "link")
    .attr("x1", d => d.source.y)
    .attr("y1", d => d.source.x)
    .attr("x2", d => d.target.y)
    .attr("y2", d => d.target.x);

const clickedNodes = [];

const node = gNode.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`)
    .attr("cursor", "pointer")
    .on("click", clicked);

node.append("rect")
    .attr("width", 120)
    .attr("height", 30)
    .attr("x", -60)
    .attr("y", -15)
    .attr("fill", d => d.depth === 0 ? "#ffcccc" : d.depth === 1 ? "#cce5ff" : "#d5ccff");

node.append("text")
    .attr("dy", "0.35em")
    .attr("x", 0)
    .attr("text-anchor", "middle")
    .text(d => d.data.name);

function clicked(event, d) {
    const rect = d3.select(event.currentTarget).select("rect");
    const currentColor = rect.attr("fill");
    const index = clickedNodes.findIndex(node => node.id === d.data.id);

    if (index === -1) {
        // Add new node to clickedNodes with its current color
        clickedNodes.push({ id: d.data.id, color: currentColor });
        rect.attr("fill", "#3f4294"); // Change color to indicate selection
    } else {
        // Node is already in clickedNodes, remove it and revert color
        rect.attr("fill", clickedNodes[index].color);
        clickedNodes.splice(index, 1);
    }
    console.log("Clicked Nodes:", clickedNodes);
}

