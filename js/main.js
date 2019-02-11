var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);


var map;
var player;
var balls;
var cursors;
var groundLayer, coinLayer;
var text;
var score = 0;
var scaleChico=1;
var dead = false;
var numBalls = 16;
var ballSizes = 6; 
var numCoins = 100;
var pulsadaE = false;
var gameOver = false;

function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/miMapa.json');
    // tiles in spritesheet 
    this.load.spritesheet('tiles', 'assets/tiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.spritesheet('coin', 'assets/moneda.png', {frameWidth: 70, frameHeight: 70});
    this.load.image('botiquin', 'assets/botiquin.png');
    // player animations
    this.load.atlas('player', 'assets/chico_ss.png', 'assets/chico_ss.json');
    this.load.image('ball', 'assets/ball.png');
    this.load.image('splash', 'assets/splash2.png');
    this.load.image('gameOver', 'assets/gameOver.png');
    this.load.audio("pop", ["assets/audio/pop.ogg", "assets/sounds/pop.mp3"]);
    this.load.audio("collectCoin", ["assets/audio/coin.ogg", "assets/sounds/coin.mp3"]);
    this.load.audio("collectHealth", ["assets/audio/health.ogg", "assets/sounds/health.mp3"]);

}


function create() {
    CrearAnimaciones(this);
    
    // load the map 
    map = this.make.tilemap({key: 'map'});

    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);



    this.collectableItems = this.physics.add.group();
    this.collectableItems.soundCoin  = this.sound.add("collectCoin");
    this.collectableItems.soundHealth  = this.sound.add("collectHealth");

    
    for (var i = 0; i < numCoins + 5; i++) {

        var x = 30 + Math.random( )*(groundLayer.width-30) ;
        var y = -Math.random( )*500*i ;

        if( (i+1)%20==0)       theItem = "botiquin";
        else                    theItem = "coin"; 

        var item = this.collectableItems.create(x, y, theItem);
        item.body.gravity.y=-450;
        item.body.maxVelocity.y =100;
        item.type = theItem;
        if(theItem == "coin")
        {
              item.anims.play('girar', true);
              item.setScale(0.5,0.5);
        }
        item.setBounceY(0.25);
        
	}

    
    this.physics.add.collider(this.collectableItems, groundLayer);
    
    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

        

    // create the player sprite    
    player = this.physics.add.sprite(140, 340, 'player');
    player.setScale(scaleChico,scaleChico);
    player.energy = 100; 
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width-50, player.height-18);
    player.anims.play('jump', true);
    player.body.offset.x = 0;
    

    cursors = this.input.keyboard.createCursorKeys();

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');
    
 
       
    balls = this.physics.add.group();
    balls.popSound = this.sound.add("pop");


    arrayBalls = [];


    for(var i=0; i<numBalls; i++)           CreateNewBall(balls, arrayBalls)
    

 


//  The score
scoreText = this.add.text(16, 550, 'Score: 0', {  font: "bold 28px Acme", fill: "#333"});
scoreText.setScrollFactor(0);
coinsLeftText = this.add.text(600, 550, 'Coins Left: ' + numCoins, {  font: "bold 28px Acme", fill: "#333"});
coinsLeftText.setScrollFactor(0);


    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, player);
    this.physics.add.overlap(player, this.collectableItems, collectItem, null, this);


    this.physics.add.collider(balls, groundLayer);
    this.physics.add.collider(player, balls, hitBall, null, this);
    
 
    DrawEnergyBar(this);


    
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    splash = this.add.image(400, 300, 'splash');
    splash.visible=false;
    splash.setScrollFactor(0);
    splash.setDepth(99999)

}


function DrawEnergyBar(world)
{
    lifeBgRect = world.add.graphics({ fillStyle: { color: 0x000000 } }).fillRectShape( new Phaser.Geom.Rectangle(0, 20, 220, 20) );
    lifeBgRect.setScrollFactor(0);
    lifeMeter = world.add.graphics({ fillStyle: { color: 0xcc0000 } }).fillRectShape(new Phaser.Geom.Rectangle(0, 20, 220, 20) );;
    lifeMeter.setScrollFactor(0);
    energyText = world.add.text(560, 21, 'Energy:', {  font: "bold 14px Acme", fill: "#fff"});
    energyText.setScrollFactor(0);

    lifeBgRect.x = 550;
    lifeMeter.x = 550;
}

function UpdateEnergyBar(newEnergy)
{
    lifeMeter.scaleX = newEnergy/100;
}

function update(time, delta) 
{
    if (keyE.isDown && pulsadaE!=true)
    {
        pulsadaE = true;
        splash.visible = !splash.visible;
        if( splash.visible == true)             this.physics.pause();
        else                                    this.physics.resume();

        setTimeout(function() {   pulsadaE = false;   }, 500); // espera 0.5 seg
    }

    if(dead == false)
    {
            if(player.body.onFloor())  saltando=false;
            else                        saltando = true;
            
            if (cursors.left.isDown)
            {
                player.body.setSize(player.width-50, player.height-18);
                player.body.offset.x = 42;
                
            
                player.body.setVelocityX(-200);
                player.flipX = true; // flip the sprite to the left
                if(saltando == false) player.anims.play('run', true);
            }
            else if (cursors.right.isDown)
            {
                player.body.setSize(player.width-50, player.height-18);
                player.body.offset.x = 0;
            
                player.body.setVelocityX(200);
                player.flipX = false; // use the original sprite looking to the right
                if(saltando == false) player.anims.play('run', true);

            } else {
                player.body.setVelocityX(0);
                if(saltando == false)             player.anims.play('idle', true);
            }
            // jump 
            if (cursors.up.isDown && player.body.onFloor())
            {
                saltando = true;
                player.anims.play('jump', true);
                player.body.setVelocityY(-500);        
            }
    }


}


function collectItem(sprite, tile) {

    tile.disableBody(true, true);

    if(tile.type == "coin")
    {
        numCoins--;
        score += 10; // increment the score
        scoreText.setText("Score: " + score); // set the text to show the current score
        coinsLeftText.setText("Coins Left: " + numCoins); // set the text to show the current score
        this.collectableItems.soundCoin.play();
    }
    else if(tile.type == "botiquin")
    {
            player.energy += 50; // increment the score
            if(player.energy>100) player.energy = 100;
        
            UpdateEnergyBar(player.energy);
            this.collectableItems.soundHealth.play();
        }
  //  this.growSound.play();
    return false;
}



function hitBall (player, ball)
{

     SplitBall(balls, arrayBalls, ball);
    

    if(dead == false)     
    {
        if(player.energy>0) 
        {
                player.energy -=5;
                UpdateEnergyBar( player.energy );
                player.setTint(0x000000);

                setTimeout(function() {  if(dead==false) {player.clearTint(); }   }, 500); // espera 0.5 seg
        }
        else
        {
            setGameOver(this);
            player.setTint(0xff0000);
            player.anims.play('dead', true);

            dead = true;
            player.body.setSize(player.width, player.height-42);
            player.body.offset.x = 0;
            player.body.offset.y = 30;
        }
      // 
    }
    player.body.setVelocityX(0);
}

function CreateNewBall(group, array)
{
        var i = array.length;
                
        ballType = Math.round( 1+Math.random()*4) ;
        array[i] = balls.create( 200+Math.random()*groundLayer.width, 16, 'ball');
        array[i].setCollideWorldBounds(true);
        array[i].setVelocity(Phaser.Math.Between(-200, 200), 20);

        array[i].id = i;
        array[i].allowGravity = false;

        array[i].type = ballType;
        array[i].myBounce = (0.5 + (0.5/ballSizes) * ballType) ;
        array[i].setBounce(array[i].myBounce );
        array[i].setBounce(1);

        array[i].setScale( 0.1 + (0.9/ballSizes)*ballType);
        array[i].body.stopVelocityOnCollide  = false;
}

function SplitBall(group, array, cBall)
{
 
    if(dead) return;

    group.popSound.play();
        

    if(cBall.type>0)      
    {
        cBall.disableBody(true, true);
        var n = array.length;
        
        for(i=n;i<n+2;i++)
        {
            array[i] = balls.create( cBall.x, cBall.y, 'ball');
            ballType = cBall.type-1;

            array[i].setCollideWorldBounds(true);
            
            if(i%2==0)            array[i].setVelocity(-120, -500);
            else                  array[i].setVelocity(120, -500);
        
            array[i].id = i;
            array[i].allowGravity = false;

            array[i].type = ballType;
            array[i].myBounce = (0.5 + (0.5/ballSizes) * ballType) ;
            array[i].setBounce(array[i].myBounce );
            array[i].setBounce(1);

            array[i].setScale( 0.1 + (0.9/ballSizes)*ballType);
            array[i].body.stopVelocityOnCollide  = false;
        }
    }
    else    cBall.disableBody(true, true);

    score -= 5; // decrement the score
    if(score<0) score = 0;
    scoreText.setText("Score: " + score); // set the text to show the current score
    
}

function CrearAnimaciones(world)
{
    
    // player run animation
    world.anims.create({
        key: 'run',
        frames: world.anims.generateFrameNames('player', {prefix: 'Run', start: 1, end: 15, zeroPad: 2}),
        frameRate: 24,
        repeat: -1
    });
    
    world.anims.create({
        key: 'idle',
        frames: world.anims.generateFrameNames('player', {prefix: 'Idle', start: 1, end: 15, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });

    world.anims.create({
        key: 'jump',
        frames: world.anims.generateFrameNames('player', {prefix: 'Jump', start: 1, end: 15, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    
    world.anims.create({
        key: 'dead',
        frames: world.anims.generateFrameNames('player', {prefix: 'Dead', start: 1, end: 15, zeroPad: 2}),
        frameRate: 10
        //repeat: -1
    });
    
    world.anims.create({
        key: 'girar',
        frames: world.anims.generateFrameNumbers('coin', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
    });


}


function setGameOver(world)
{
    world.cameras.main.shake(500);

    var theWorld = world;


    setTimeout(function() {  
       
        gameOver = true;

        gameOverSplash = theWorld.add.image(0, 0, 'gameOver');
        gameOverSplash.setOrigin(0,0);
        gameOverSplash.setScrollFactor(0);
        gameOverSplash.alpha=0;

                theWorld.add.tween({
                    targets: [gameOverSplash],
                    ease: 'Sine.easeInOut',
                    duration: 2500,
                    delay: 0,
                    alpha: {
                    getStart: () => 0,
                    getEnd: () => 100
                    },
                    onComplete: () => {

                        theWorld.physics.pause();

                    }
                });


              setTimeout(function() {   location.reload();       } , 5000); //restart the game
       

      }, 1500);
}
