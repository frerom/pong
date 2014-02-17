var gast = require("gast");
var _ = require("lodash");
var gameWidth = 500,
    gameHeight = 250;

var randomBetween = function(min, max) {
  return min + (max - min) * Math.random();
};

var randomIntBetween = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var randomBetweenRanges = function () {
  var ranges = Array.prototype.slice.call(arguments);
  var range = ranges[randomIntBetween(0, ranges.length - 1)];
  return randomBetween(range[0], range[1]);
};

gast.system("movement", ["frame"], function (entities, delta) {
  _.each(_.filter(entities, "movement"), function (entity) {
    entity.position.x = entity.position.x + Math.cos(entity.movement.direction) * entity.movement.speed * (delta / 1000);
    entity.position.y = entity.position.y + Math.sin(entity.movement.direction) * entity.movement.speed * (delta / 1000);
    gast.trigger("moved", entities, entity, delta);
  });
});

gast.system("start", ["keyboard-input"], function (entities, keyCode, press) {
  if (keyCode === 32) {
    var ball = _.find(entities, "ball");
    if (ball.movement.speed === 0) {
      ball.movement.speed = ball.movement.speed > 0 ? ball.movement.speed : 250;
      ball.movement.direction = randomBetweenRanges([7 * Math.PI / 4, 2 * Math.PI],[0, Math.PI / 4], [3 * Math.PI / 4, 5 * Math.PI / 4]);
    }
  }
});

gast.system("user-movement", ["keyboard-input"], function (entities, keyCode, press) {
  _.each(_.filter(entities, function (entity) { return !!entity.input && !!entity.input[keyCode]; }), function (entity) {
    var key = entity.input[keyCode];
    if (key === "up") {
      entity.movement.speed = press ? entity.movement.speed - gameHeight : entity.movement.speed + gameHeight ;
    }
    else {
      entity.movement.speed = press ? entity.movement.speed + gameHeight : entity.movement.speed - gameHeight ;
    }
  });
});

gast.system("collision-detection", ["moved"], function (entities, movedEntity, delta) {
  _.each(entities, function (entity) {
    if (entity !== movedEntity) {
      var p1X = entity.position.x - entity.size.width / 2,
          p1Y = entity.position.y - entity.size.height /2,
          p1W = entity.size.width,
          p1H = entity.size.height,
          p2X = movedEntity.position.x - movedEntity.size.width / 2,
          p2Y = movedEntity.position.y - movedEntity.size.height /2,
          p2W = movedEntity.size.width,
          p2H = movedEntity.size.height;
      if (!(
        p1X > p2X + p2W ||
        p1Y > p2Y + p2H ||
        p2X > p1X + p1W ||
        p2Y > p1Y + p1H
      )) {
        gast.trigger("collision", entity, movedEntity, delta);
      }
    }
  });
});

gast.system("wall-ball-collision", ["collision"], function (entity1, entity2, delta) {
  var wall = entity1.wall ? entity1 : entity2.wall ? entity2 : false;
  var ball = entity1.ball ? entity1 : entity2.ball ? entity2 : false;
  if (wall && ball) {
    var sin = Math.sin(ball.movement.direction);
    ball.position.y = wall.position.y + (-sin / Math.abs(sin)) * ( wall.size.height / 2 + ball.size.height / 2 + 1);
    ball.movement.direction = 2 * Math.PI - ball.movement.direction;
  }
});

gast.system("wall-player-collision", ["collision"], function (entity1, entity2, delta) {
  var wall = entity1.wall ? entity1 : entity2.wall ? entity2 : false;
  var player = entity1.player ? entity1 : entity2.player ? entity2 : false;
  if (wall && player) {
    player.position.y = wall.position.y - ( player.size.height / 2 + 1)* (player.movement.speed / Math.abs(player.movement.speed)) * Math.sin(player.movement.direction);
  }
});

gast.system("player-ball-collision", ["collision"], function (entity1, entity2, delta) {
  var player = entity1.player ? entity1 : entity2.player ? entity2 : false;
  var ball = entity1.ball ? entity1 : entity2.ball ? entity2 : false;
  if (player && ball) {
    var cos = Math.cos(ball.movement.direction);
    ball.position.x = player.position.x + (-cos / Math.abs(cos)) * ( player.size.width / 2 + ball.size.width / 2 + 1);
    ball.movement.direction = Math.PI - ball.movement.direction;
    ball.movement.speed = ball.movement.speed + 10;
  }
});

gast.system("ball-goal-collision", ["collision"], function (entity1, entity2, delta) {
  var goal = entity1.goal ? entity1 : entity2.goal ? entity2 : false;
  var ball = entity1.ball ? entity1 : entity2.ball ? entity2 : false;
  if (goal && ball) {
    ball.position.x = gameWidth / 2;
    ball.position.y = gameHeight / 2;
    ball.movement.direction = Math.PI - ball.movement.direction;
    ball.movement.speed = 0;
  }
});


var canvas = window.document.querySelector("#pingpong");
canvas.width = gameWidth;
canvas.height = gameHeight;
var ctx = canvas.getContext("2d");

gast.system("clear", ["frame"], function () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

gast.system("draw-ball", ["frame"], function (entities) {
  _.each(_.filter(entities, "ball"), function (entity) {
    ctx.beginPath();
    ctx.fillStyle = entity.color;
    ctx.fillRect(entity.position.x - entity.size.width / 2, entity.position.y - entity.size.height / 2, entity.size.width, entity.size.height);
  });
});

gast.system("draw-player", ["frame"], function (entities) {
  _.each(_.filter(entities, "player"), function (entity) {
    ctx.beginPath();
    ctx.fillStyle = entity.color;
    ctx.fillRect(entity.position.x - entity.size.width / 2, entity.position.y - entity.size.height / 2, entity.size.width, entity.size.height);
  });
});

var entities = [
  {
    ball: true,
    position: {
      x: gameWidth / 2,
      y: gameHeight / 2
    },
    color: "#FF0000",
    movement: {
      direction: 0,
      speed: 0
    },
    size: {
      width: 10,
      height: 10
    }
  },
  {
    player: true,
    position: {
      x: 5,
      y: gameHeight / 2
    },
    size : {
      width: 10,
      height: 50
    },
    color: "#000000",
    movement: {
      direction: Math.PI / 2,
      speed: 0
    },
    input: {
      87: "up",
      83: "down"
    }
  },
  {
    player: true,
    position: {
      x: gameWidth - 5,
      y: gameHeight / 2
    },
    size : {
      width: 10,
      height: 50
    },
    color: "#000000",
    movement: {
      direction: Math.PI / 2,
      speed: 0
    },
    input: {
      38: "up",
      40: "down"
    }
  },
  {
    wall: true,
    size: {
      width: gameWidth,
      height: 0
    },
    position: {
      x: gameWidth / 2,
      y: -1
    }
  },
  {
    wall: true,
    size: {
      width: gameWidth,
      height: 0
    },
    position: {
      x: gameWidth / 2,
      y: gameHeight + 1
    }
  },
  {
    goal: true,
    size: {
      width: 0,
      height: gameHeight
    },
    position: {
      x: gameWidth,
      y: gameHeight / 2
    }
  },
  {
    goal: true,
    size: {
      width: 0,
      height: gameHeight
    },
    position: {
      x: 0,
      y: gameHeight / 2
    }
  }
];

(function () {
  var keys = {};
  document.onkeydown = function (event) {
    if (!keys[event.keyCode]) {
      keys[event.keyCode] = true;
      gast.trigger("keyboard-input", entities, event.keyCode, true);
    }
  };

  document.onkeyup = function (event) {
    if (keys[event.keyCode]) {
      keys[event.keyCode] = false;
      gast.trigger("keyboard-input", entities, event.keyCode, false);
    }
  };
}());

gast.loop(function (delta) {
  gast.trigger("frame", entities, delta);
}, window.requestAnimationFrame.bind(window))(0);
