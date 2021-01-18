let { Engine, Render, World, Bodies, Runner, Body, Events } = Matter;

let width = window.innerWidth;
let height = window.innerHeight;
let cellsHorizontal = 8;
let cellsVertical = 8;
let unitLengthX = width / cellsHorizontal;
let unitLengthY = height / cellsVertical;

let engine = new Engine.create();
engine.world.gravity.y = 0;
let { world } = engine;
let render = Render.create({
  element: document.body,
  engine,
  options: {
    width,
    height,
    wireframes: true,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

//walls
let walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, width / 2, 2, height, { isStatic: true }),
]; //you can pass array of shapes into world at once

World.add(world, walls);

//shuffle function
function shuffle(arr) {
  let counter = arr.length;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    [arr[counter], arr[index]] = [arr[index], arr[counter]];
  }
  return arr;
}

//maze generation
let grid = Array(cellsVertical)
  .fill(null)
  .map((_) => Array(cellsHorizontal).fill(false));

let verticals = Array(cellsVertical)
  .fill(null)
  .map((_) => Array(cellsHorizontal - 1).fill(false));

let horizontal = Array(cellsVertical - 1)
  .fill(null)
  .map((_) => Array(cellsHorizontal).fill(false));

let startRow = Math.floor(Math.random() * cellsVertical);
let startColumn = Math.floor(Math.random() * cellsHorizontal);

let stepThrowCell = (row, col) => {
  //if i have visited the [row,cell] then return
  if (grid[row][col]) {
    return;
  }
  //mark the cell as visited
  grid[row][col] = true;
  //assemble a random  ordered list of neighbor cells
  let neighbors = [
    [row - 1, col, "up"], //top
    [row, col + 1, "right"], //right,
    [row + 1, col, "down"], //down
    [row, col - 1, "left"], // left
  ];
  //shuffle
  neighbors = shuffle(neighbors);
  //for Each neighbor
  for (let neighbor of neighbors) {
    //check if the neighbor is in bound
    let [nextRow, nextColumn, direction] = neighbor;
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue; //do another loop
    }
    if (grid[nextRow][nextColumn]) {
      continue;
    }
    //remove the wall for the direction
    //Verticals:
    //in vertical Row never changes the column is the one is going ro change base on the direction
    if (direction === "left") {
      verticals[row][col - 1] = true; //removes the wall
    } else if (direction === "right") {
      verticals[row][col] = true;
    } else if (direction === "up") {
      //Horizontal
      //in this case the columns not going to change only the row is going to change
      horizontal[row - 1][col] = true;
    } else if (direction === "down") {
      horizontal[row][col] = true;
    }
    //because we have the nextRow nextColumn now we can recursive call it
    stepThrowCell(nextRow, nextColumn);
  }
};
stepThrowCell(startRow, startColumn);

//here we can make sure that the horizontal and vertical now is some
horizontal.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    let wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "red",
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    let walls = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      { isStatic: true, label: "wall", render: { fillStyle: "red" } }
    );
    World.add(world, walls);
  });
});
//Goal
let goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  { isStatic: true, label: "goal", render: { fillStyle: "green" } }
);

World.add(world, goal);

//Ball
let ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
let ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: { fillStyle: "red", strokeStyle: "blue", lineWidth: 3 },
});

World.add(world, ball);

document.addEventListener("keydown", (event) => {
  let { x, y } = ball.velocity;
  if (event.keyCode === 87) {
    Body.setVelocity(ball, { x: x, y: y - 5 });
  }
  if (event.keyCode === 68) {
    Body.setVelocity(ball, { x: x + 5, y: y });
  }
  if (event.keyCode === 83) {
    Body.setVelocity(ball, { x, y: y + 5 });
  }
  if (event.keyCode === 65) {
    Body.setVelocity(ball, { x: x - 5, y });
  }
});

//When collision happens

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    let labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
