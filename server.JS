// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

// Dictionnaire officiel UNDERTAKER (15 paires de démarrage, extensible)
const DB = [
  {a:'Café',b:'Thé',i:'Boisson',bav:'Tasse'},
  {a:'Pizza',b:'Burger',i:'Fromage',bav:'Four'},
  {a:'Chocolat',b:'Nutella',i:'Sucre',bav:'Noir'},
  {a:'Croissant',b:'Pain au chocolat',i:'Boulanger',bav:'Beurre'},
  {a:'Champagne',b:'Prosecco',i:'Alcool',bav:'Bulles'},
  {a:'Sushi',b:'Maki',i:'Japon',bav:'Riz'},
  {a:'Lion',b:'Tigre',i:'Savane',bav:'Crinière'},
  {a:'Requin',b:'Dauphin',i:'Mer',bav:'Nageoire'},
  {a:'Plage',b:'Piscine',i:'Eau',bav:'Sable'},
  {a:'Forêt',b:'Jungle',i:'Arbre',bav:'Champignon'},
  {a:'Batman',b:'Spider-Man',i:'Super-héros',bav:'Cape'},
  {a:'Harry Potter',b:'Hermione',i:'Sorcier',bav:'Baguette'},
  {a:'Guitare',b:'Violon',i:'Musique',bav:'Corde'},
  {a:'Téléphone',b:'Tablette',i:'Écran',bav:'Batterie'},
  {a:'Avion',b:'Fusée',i:'Voler',bav:'Aile'}
];

const BAV_POOL = ['Choucroute','Bananier','Parapluie','Licorne','Cacahuète','Farfadet','Marmotte','Tapioca','Poulpe','Ravioli'];

// Équilibrage strict de 3 à 12 joueurs
const ROLE_TABLE = {
  3:  {civil:2, under:1, white:0},
  4:  {civil:2, under:1, white:1},
  5:  {civil:3, under:1, white:1},
  6:  {civil:4, under:1, white:1},
  7:  {civil:4, under:2, white:1},
  8:  {civil:5, under:2, white:1},
  9:  {civil:6, under:2, white:1},
  10: {civil:6, under:2, white:2},
  11: {civil:7, under:2, white:2},
  12: {civil:8, under:2, white:2}
};

let rooms = {}; 

io.on('connection', (socket) => {
  
  // CRÉATION DE SALON
  socket.on('createRoom', ({ username }) => {
    let roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    rooms[roomCode] = {
      code: roomCode,
      players: [],
      gameState: 'LOBBY', 
      opts: { interdit: false, blitz: false, bavard: false, muet: false, oracle: false, hunter: false },
      wordA: '', wordB: '', interditWord: '', bavWord: '',
      bavardIdx: -1, muetActive: false,
      speechOrder: [], currentSpeakerIdx: 0,
      votes: {}, pendingWhiteId: null, pendingHunterId: null
    };
    joinRoomLogic(socket, roomCode, username);
  });

  // REJOINDRE UN SALON
  socket.on('joinRoom', ({ roomCode, username }) => {
    roomCode = roomCode.toUpperCase();
    if (!rooms[roomCode]) return socket.emit('errorMsg', 'Cimetière introuvable !');
    if (rooms[roomCode].gameState !== 'LOBBY') return socket.emit('errorMsg', 'Partie déjà commencée !');
    if (rooms[roomCode].players.length >= 12) return socket.emit('errorMsg', 'Salon complet (max 12) !');
    
    joinRoomLogic(socket, roomCode, username);
  });

  // LANCEMENT DE LA PARTIE VIA L'HÔTE
  socket.on('startGame', ({ roomCode, opts }) => {
    let room = rooms[roomCode];
    if (!room || room.players[0].id !== socket.id) return; 
    if (room.players.length < 3) return socket.emit('errorMsg', 'Il faut au moins 3 fossoyeurs pour jouer !');

    room.opts = opts;
    room.gameState = 'PLAYING';
    
    let pair = DB[Math.floor(Math.random() * DB.length)];
    let swap = Math.random() > 0.5;
    room.wordA = swap ? pair.b : pair.a;
    room.wordB = swap ? pair.a : pair.b;
    room.interditWord = pair.i;
    room.bavWord = BAV_POOL[Math.floor(Math.random() * BAV_POOL.length)];

    let config = ROLE_TABLE[room.players.length];
    let roles = [];
    for(let i=0; i<config.civil; i++) roles.push('civil');
    for(let i=0; i<config.under; i++) roles.push('under');
    for(let i=0; i<config.white; i++) roles.push('white');
    
    // Mélange de Fisher-Yates
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    if(room.opts.bavard) room.bavardIdx = Math.floor(Math.random() * room.players.length);
    room.muetActive = room.opts.muet;

    room.players.forEach((p, idx) => {
      p.role = roles[idx];
      p.alive = true;
      p.isBavard = (room.opts.bavard && idx === room.bavardIdx);
      p.word = p.role === 'civil' ? room.wordA : (p.role === 'under' ? room.wordB : '???');
    });

    generateSpeechOrder(room);
    
    room.players.forEach((p) => {
      io.to(p.id).emit('gameStarted', {
        role: p.role,
        word: p.word,
        isBavard: p.isBavard,
        bavWord: room.bavWord,
        opts: room.opts,
        interditWord: room.interditWord,
        muetActive: room.muetActive,
        speechOrder: room.speechOrder
      });
    });
  });

  // TRANSITION VERS LE VOTE GENERAL
  socket.on('startVotingPhase', (roomCode) => {
    let room = rooms[roomCode];
    if (!room) return;
    room.gameState = 'VOTING';
    room.votes = {};
    io.to(roomCode).emit('votingPhase', { players: room.players.filter(p => p.alive) });
  });

  // ENREGISTREMENT D'UN VOTE EN LIGNE
  socket.on('submitVote', ({ roomCode, targetId }) => {
    let room = rooms[roomCode];
    if (!room || room.gameState !== 'VOTING') return;
    
    room.votes[socket.id] = targetId;
    let alivePlayers = room.players.filter(p => p.alive);
    
    if (Object.keys(room.votes).length === alivePlayers.length) {
      resolveVotes(roomCode);
    }
  });

  // MR WHITE TENTE DE DEVINER LE MOT
  socket.on('submitWhiteGuess', ({ roomCode, guess }) => {
    let room = rooms[roomCode];
    if (!room) return;
    let whitePlayer = room.players.find(p => p.id === room.pendingWhiteId);
    let target = room.wordA.toLowerCase();
    
    if (guess.trim().toLowerCase() === target || (target.includes(guess.trim().toLowerCase()) && guess.trim().length > 2)) {
      endGame(roomCode, 'white_win', `🕵️ Mr White (${whitePlayer.username}) s'est échappé de la tombe ! Il a deviné le mot "${room.wordA}".`);
    } else {
      io.to(roomCode).emit('toastMsg', `❌ Mauvais mot ! Mr White reste enterré.`);
      checkVictoryConditions(roomCode);
    }
  });

  // POUVOIR DU CHASSEUR ÉLIMINÉ
  socket.on('submitHunterShot', ({ roomCode, targetId }) => {
    let room = rooms[roomCode];
    if (!room) return;
    let target = room.players.find(p => p.id === targetId);
    
    if (target.role === 'under' || target.role === 'white') {
      target.alive = false;
      io.to(roomCode).emit('toastMsg', `🎯 Tir parfait ! L'intrus ${target.username} est envoyé à la morgue !`);
    } else {
      io.to(roomCode).emit('toastMsg', `💨 Balle perdue ! ${target.username} était innocent.`);
    }
    checkVictoryConditions(roomCode);
  });

  socket.on('disconnect', () => {
    for (let code in rooms) {
      let room = rooms[code];
      let idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          io.to(code).emit('roomUpdated', { players: room.players });
        }
        break;
      }
    }
  });
});

function joinRoomLogic(socket, roomCode, username) {
  socket.join(roomCode);
  let isHost = rooms[roomCode].players.length === 0;
  
  rooms[roomCode].players.push({
    id: socket.id,
    username: username,
    isHost: isHost,
    alive: true,
    role: '', word: '', isBavard: false
  });

  socket.emit('joinSuccess', { roomCode, isHost });
  io.to(roomCode).emit('roomUpdated', { players: rooms[roomCode].players });
}

function generateSpeechOrder(room) {
  let alive = room.players.filter(p => p.alive);
  room.speechOrder = [...alive].sort(() => Math.random() - 0.5).map(p => ({ id: p.id, username: p.username }));
}

function resolveVotes(roomCode) {
  let room = rooms[roomCode];
  let count = {};
  
  Object.values(room.votes).forEach(id => { count[id] = (count[id] || 0) + 1; });
  
  let maxVotes = 0;
  let eliminatedId = null;
  for (let id in count) {
    if (count[id] > maxVotes) { maxVotes = count[id]; eliminatedId = id; }
  }

  let p = room.players.find(pl => pl.id === eliminatedId);
  p.alive = false;

  io.to(roomCode).emit('playerEliminated', { username: p.username, role: p.role });

  if (p.role === 'white') {
    room.gameState = 'REVEAL_WHITE';
    room.pendingWhiteId = p.id;
    io.to(roomCode).emit('whiteGuessPhase', { whiteName: p.username, whiteId: p.id });
    return;
  }

  if (p.role === 'civil' && room.opts.hunter) {
    room.gameState = 'HUNTER_SHOT';
    room.pendingHunterId = p.id;
    io.to(roomCode).emit('hunterShotPhase', { hunterId: p.id, hunterName: p.username, targets: room.players.filter(pl => pl.alive && pl.id !== p.id) });
    return;
  }

  if (room.opts.oracle) {
    let status = p.role === 'civil' ? '🍏 CIVIL' : '🦊 INTRUS';
    io.to(roomCode).emit('toastMsg', `🔮 Oracle : ${p.username} était un [${status}] !`);
  }

  checkVictoryConditions(roomCode);
}

function checkVictoryConditions(roomCode) {
  let room = rooms[roomCode];
  let alive = room.players.filter(p => p.alive);
  let civils = alive.filter(p => p.role === 'civil');
  let impostors = alive.filter(p => p.role === 'under' || p.role === 'white');

  if (impostors.length === 0) {
    endGame(roomCode, 'civils', "Le Croque-mort a enterré tous les traîtres ! Victoire des Civils !");
  } else if (civils.length <= impostors.length) {
    endGame(roomCode, 'impostors', "Les infiltrés ont creusé la tombe de l'alliance ! Victoire des Intrus.");
  } else {
    room.muetActive = false;
    generateSpeechOrder(room);
    room.gameState = 'PLAYING';
    io.to(roomCode).emit('nextRound', { speechOrder: room.speechOrder });
  }
}

function endGame(roomCode, winner, desc) {
  let room = rooms[roomCode];
  room.gameState = 'ENDED';
  io.to(roomCode).emit('gameOver', { winner, desc, allPlayers: room.players, wordA: room.wordA, wordB: room.wordB });
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`⚰️ UNDERTAKER tourne sur le port ${PORT}`));