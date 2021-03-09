let boids = [];
let walls = [];
let BOID_COUNT = 500;
let DRAW_WALLS = false;
let CONTINUE = true;
let MONITOR = -1;
let COHESION_MULTIPLIER = 1;
let ALIGNMENT_MULTIPLIER = 1;
let SEPARATION_MULTIPLIER = 1;
let OBSTACLE_POLL_COUNT = 8;

function setup() {
  angleMode(RADIANS);
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
  reset();
}

let createBoid = (id) => { return {
    x: floor(random(windowWidth)),
    y: floor(random(windowHeight)),
    direction: random(2*PI),
    radius: 15,
    speed: 3,
    sightRadius: 50,
    id: id,
    color: '#1f1f1f'
  }
}
let createPoint = (xPos, yPos) => { return {x: xPos, y: yPos} }
let createWall = (x1, y1, x2, y2) => { walls.push({p1: createPoint(x1, y1), p2: createPoint(x2, y2)}) };
let createWallsFromRect = (x, y, width, height) => {
  createWall(x, y, x + width, y);
  createWall(x + width, y + height, x + width, y);
  createWall(x + width, y + height, x, y + height);
  createWall(x, y, x, y + height);
}

function reset() {
  // generate boids;
  boids = [];
  for(let i = 0; i < BOID_COUNT; ++i) {
    boids.push(createBoid(i));
  }
  walls = [];
  createWallsFromRect(0, 0, windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reset();
}

// draws a boid at at x, y
// radius controls size
function drawBoid(b) {
  fill(b.color);
  noStroke();
  let narrow = 0.8*PI; // increasing coefficient makes boid narrower
  let p1 = createPoint(b.x + cos(b.direction) * b.radius,           b.y + sin(b.direction) * b.radius);
  let p2 = createPoint(b.x + cos(b.direction - narrow) * b.radius,  b.y + sin(b.direction - narrow) * b.radius);
  let p3 = createPoint(b.x + cos(b.direction + PI) * b.radius / 3,  b.y + sin(b.direction + PI) * b.radius / 3);
  let p4 = createPoint(b.x + cos(b.direction + narrow) * b.radius,  b.y + sin(b.direction + narrow) * b.radius);
  quad(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
  // noFill();
  // stroke('#1f1f1f');
  // circle(x, y, radius * 2);
}

function drawWall(wall) {
  strokeWeight(2);
  stroke('#000000');
  line(wall.p1.x, wall.p1.y, wall.p2.x, wall.p2.y);
}

function draw() {
  background('#CDEAEB');
  // advance & draw boids
  for(let boid of boids) {
    advance(boid);
    drawBoid(boid);
    boid.color = '#1f1f1f';
  }
  // draw walls
  if (DRAW_WALLS) {
    for(let wall of walls) {
      drawWall(wall);
    }
  }
}

// advances boid forward one generation
function advance(boid) {
  let flockmates = boids.filter(cand => dist(boid.x, boid.y, cand.x, cand.y) < boid.sightRadius && !(cand === boid));
  if (dist(boid.x, boid.y, mouseX, mouseY) < boid.sightRadius) flockmates.push({x: mouseX, y: mouseY, direction: boid.direction, sightRadius: boid.sightRadius});
  // cohesion
  let flockCenter = createPoint(
    flockmates.reduce((a, b) => a + b.x, 0) / flockmates.length - boid.x,
    flockmates.reduce((a, b) => a + b.y, 0) / flockmates.length - boid.y
  );
  // alignment
  let flockHeading = createPoint(
    flockmates.reduce((a, b) => a + heading(b).x, 0) / flockmates.length - boid.x,
    flockmates.reduce((a, b) => a + heading(b).y, 0) / flockmates.length - boid.y
  );
  // separation
  let steerAway = createPoint(
    flockmates.reduce((a, b) => a - (cos(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius) - (b.x - boid.x), 0) / flockmates.length,
    flockmates.reduce((a, b) => a - (sin(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius) - (b.y - boid.y), 0) / flockmates.length
  );
  let obstacles = obstacleAvoidance(boid);
  let average = createPoint(
    (flockCenter.x + flockHeading.x + steerAway.x) / 3,
    (flockCenter.y + flockHeading.y + steerAway.y) / 3
  );
  average.x += obstacles.x / 2;
  average.y += obstacles.y / 2;
  let dirVect = createPoint(cos(boid.direction), sin(boid.direction));
  dirVect.x += (average.x - dirVect.x) / boid.speed;
  dirVect.y += (average.y - dirVect.y) / boid.speed;
  if (flockmates.length > 0) boid.direction = atan2(dirVect.y, dirVect.x);
  boid.x += cos(boid.direction) * boid.speed;
  boid.y += sin(boid.direction) * boid.speed;
  boid.x %= windowWidth;
  boid.y %= windowHeight;

  if (boid.id == MONITOR) {
    for(let mate of flockmates) {
      mate.color = '#00ff00';
    }
    noFill();
    stroke('white');
    circle(boid.x, boid.y, boid.sightRadius * 2);
    noStroke();
    fill('red');    circle(boid.x + flockCenter.x, boid.y + flockCenter.y, 10);
    fill('blue');   circle(boid.x + flockHeading.x, boid.y + flockHeading.y, 10);
    fill('green');  circle(boid.x + steerAway.x, boid.y + steerAway.y, 10);
    fill('black');  circle(boid.x + average.x, boid.y + average.y, 10);
    // stroke('green');
    // draw steer away markers
    // flockmates.forEach((b) => {
    //   line(b.x, b.y,
    //     boid.x + (cos(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius),
    //     boid.y + (sin(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius)
    //   )
    // });
  }
}

// gets where the boid is looking (point on sight)
function heading(boid) {
  return createPoint(
    boid.x + cos(boid.direction) * boid.sightRadius,
    boid.y + sin(boid.direction) * boid.sightRadius
  );
}

function obstacleAvoidance(boid) {
  let polls = [];
  for(let i = 0; i < OBSTACLE_POLL_COUNT; ++i) {
    polls.push({
      p1: createPoint(boid.x, boid.y),
      p2: createPoint(
        boid.x + cos(boid.direction + 2*PI*(i/OBSTACLE_POLL_COUNT)) * boid.sightRadius,
        boid.y + sin(boid.direction + 2*PI*(i/OBSTACLE_POLL_COUNT)) * boid.sightRadius
      )
    })
  }
  let obstacles = []
  for(let l of polls) {
    for (let wall of walls) {
      let inter = intersectionOf(l, wall);
      if (inter != null) {
        obstacles.push(inter);
      }
    }
    if (boid.id == MONITOR) {
      stroke('#000000');
      line(l.p1.x, l.p1.y, l.p2.x, l.p2.y);
    }
  }
  if (obstacles.length > 0) {
    let avoid = createPoint(
      obstacles.reduce((a, b) => a - pow(cos(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius - (b.x - boid.x), 1), 0) / obstacles.length,
      obstacles.reduce((a, b) => a - pow(sin(atan2(b.y - boid.y, b.x - boid.x)) * boid.sightRadius - (b.y - boid.y), 1), 0) / obstacles.length
    );
    return avoid;
  }
  return createPoint(0, 0);
}

function intersectionOf(l1, l2) {
  return intersects(l1.p1.x, l1.p1.y, l1.p2.x, l1.p2.y, l2.p1.x, l2.p1.y, l2.p2.x, l2.p2.y);
}

// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
// https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
function intersects(a,b,c,d,p,q,r,s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    let result = (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    if (result) return createPoint(a + lambda*(c-a), b + lambda*(d-b))
    else return null;
  }
};
