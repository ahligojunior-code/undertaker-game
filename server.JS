const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

app.use(express.static('public'));

// Dictionnaire UNDERTAKER - Version Élargie et Grand Public
const DB = [
  // --- SCIENCES, SVT & GÉOLOGIE ---
  {a:'Volcan', b:'Séisme', i:'Terre', bav:'Magma'},
  {a:'Planète', b:'Étoile', i:'Espace', bav:'Galaxie'},
  {a:'Cellule', b:'Bactérie', i:'Biologie', bav:'Microscope'},
  {a:'Cœur', b:'Poumon', i:'Organe', bav:'Sang'},
  {a:'Dinosaure', b:'Mammouth', i:'Fossile', bav:'Os'},
  {a:'ADN', b:'Protéine', i:'Génétique', bav:'Code'},
  
  // --- PHYSIQUE & CHIMIE ---
  {a:'Atome', b:'Molécule', i:'Matière', bav:'Noyau'},
  {a:'Électricité', b:'Magnétisme', i:'Énergie', bav:'Courant'},
  {a:'Lumière', b:'Laser', i:'Optique', bav:'Rayon'},
  {a:'Eau', b:'Glace', i:'Liquide', bav:'Vapeur'},
  {a:'Pesanteur', b:'Vitesse', i:'Gravité', bav:'Chute'},
  
  // --- GÉOGRAPHIE & NATURE ---
  {a:'Fleuve', b:'Océan', i:'Eau', bav:'Courant'},
  {a:'Montagne', b:'Colline', i:'Relief', bav:'Sommet'},
  {a:'Désert', b:'Savane', i:'Chaleur', bav:'Sable'},
  {a:'Forêt', b:'Jungle', i:'Arbre', bav:'Feuille'},
  {a:'Île', b:'Presqu\'île', i:'Terre', bav:'Plage'},
  {a:'France', b:'Italie', i:'Europe', bav:'Drapeau'},
  
  // --- HISTOIRE & MYTHOLOGIE ---
  {a:'Château', b:'Forteresse', i:'Moyen Âge', bav:'Tour'},
  {a:'Chevalier', b:'Samouraï', i:'Guerrier', bav:'Épée'},
  {a:'Pharaon', b:'Empereur', i:'Égypte', bav:'Pyramide'},
  {a:'Zeus', b:'Hercule', i:'Dieu', bav:'Éclair'},
  {a:'Roi', b:'Président', i:'Pouvoir', bav:'Couronne'},
  
  // --- AMOUR & SENTIMENTS ---
  {a:'Amour', b:'Amitié', i:'Sentiment', bav:'Cœur'},
  {a:'Mariage', b:'Fiançailles', i:'Fête', bav:'Bague'},
  {a:'Rire', b:'Sourire', i:'Joie', bav:'Humour'},
  {a:'Rêve', b:'Cauchemar', i:'Sommeil', bav:'Nuit'},
  
  // --- TECH & POP-CULTURE CLASSIC ---
  {a:'Robot', b:'Ordinateur', i:'Machine', bav:'Métal'},
  {a:'Cinéma', b:'Télévision', i:'Écran', bav:'Film'},
  {a:'Livre', b:'Bande dessinée', i:'Lecture', bav:'Page'},
  {a:'Google', b:'Apple', i:'Internet', bav:'Recherche'},
  {a:'Nintendo', b:'PlayStation', i:'Console', bav:'Jeu'},
  
  // --- QUOTIDIEN, GASTRONOMIE & ANIMAUX ---
  {a:'Café', b:'Thé', i:'Boisson', bav:'Tasse'},
  {a:'Pizza', b:'Burger', i:'Nourriture', bav:'Four'},
  {a:'Chocolat', b:'Nutella', i:'Sucre', bav:'Noir'},
  {a:'Chien', b:'Chat', i:'Animal', bav:'Poils'},
  {a:'Lion', b:'Tigre', i:'Félin', bav:'Griffe'},
  {a:'Avion', b:'Fusée', i:'Transport', bav:'Voler'},
  {a:'Guitare', b:'Piano', i:'Musique', bav:'Cordes'},

  // --- NOUVEAU : ASTRONOMIE ---
  {a:'Supernova', b:'Naine blanche', i:'Big Bang', bav:'Étoile'},
  {a:'Nébuleuse', b:'Comète', i:'Cosmos', bav:'Galaxie'},
  {a:'Exoplanète', b:'Trojan', i:'Système solaire', bav:'Écliptique'},
  {a:'Pulsar', b:'Quasar', i:'Radio', bav:'Signal'},
  {a:'Télescope', b:'Microscope', i:'Observatoire', bav:'Lentille'},

  // --- NOUVEAU : MYTHOLOGIE NORDIQUE ---
  {a:'Yggdrasil', b:'Jötunn', i:'Monde', bav:'Racine'},
  {a:'Mjölnir', b:'Valkyrie', i:'Marteau', bav:'Foudre'},
  {a:'Bifrost', b:'Gjallarhorn', i:'Pont', bav:'Son'},
  {a:'Ragnarök', b:'Fimbulwinter', i:'Apocalypse', bav:'Destin'},
  {a:'Fenrir', b:'Sköll', i:'Loup', bav:'Crocs'},

  // --- NOUVEAU : CUISINE FRANÇAISE ---
  {a:'Bouillabaisse', b:'Terrine', i:'Méditerranéen', bav:'Safran'},
  {a:'Coq au vin', b:'Ragoût', i:'Bourgogne', bav:'Shiitake'},
  {a:'Tarte Tatin', b:'Crêpe', i:'Normandie', bav:'Caramel'},

  // --- NOUVEAU : CULTURE POP MODERNE ---
  {a:'Marvel', b:'DC', i:'Bande dessinée', bav:'Panels'},
  {a:'Stranger Things', b:'Dark', i:'Netflix', bav:'Upside'},
  {a:'TikTok', b:'Snapchat', i:'Réseaux', bav:'Filtre'},
  {a:'Pokémon', b:'Évoli', i:'Capturer', bav:'Poké Ball'},
  {a:'Avatar', b:'Titanic', i:'Cinéma', bav:'3D'},

  // --- NOUVEAU : TECHNOLOGIE AVANCÉE ---
  {a:'Quantique', b:'Bitstream', i:'Superposition', bav:'Intrication'},
  {a:'Blockchain', b:'Smart contract', i:'Décentralisé', bav:'Gaz'},

  // --- NOUVEAU : AUTRES THÉMATIQUES INTERGÉNÉRATIONNELLES ---
  {a:'Renaissance', b:'Baroque', i:'Art', bav:'Fresque'},
  {a:'Sahara', b:'Désert', i:'Sable', bav:'Oasis'},
  {a:'Mongolie', b:'Sibérie', i:'Steppe', bav:'Yak'},
  {a:'Kabyle', b:'Berbère', i:'Culture', bav:'Tamazight'},
  {a:'Cygne', b:'Coccinelle', i:'Insecte', bav:'Ailes'}
];

// Pool de mots bonus pour la mécanique du "Bavard"
const BAV_POOL = ['Parapluie', 'Licorne', 'Cacahuète', 'Marmotte', 'Poulpe', 'Ravioli', 'Ananas', 'Astronaute', 'Choucroute', 'Bicyclette', 'Pixel', 'Tornade'];

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
      votes: {}, pendingWhiteId: null, pendingHunterId: null,
      usedWordIndexes: []
    };
    joinRoomLogic(socket, roomCode, username);
  });

  socket.on('joinRoom', ({ roomCode, username }) => {
    roomCode = roomCode.toUpperCase();
    if (!rooms[roomCode]) return socket.emit('errorMsg', 'Salon introuvable !');
    if (rooms[roomCode].gameState !== 'LOBBY') return socket.emit('errorMsg', 'Partie déjà commencée !');
    if (rooms[roomCode].players.length >= 12) return socket.emit('errorMsg', 'Salon complet (max 12) !');
    
    joinRoomLogic(socket, roomCode, username);
  });

  socket.on('sendMessage', ({ roomCode, message }) => {
    let room = rooms[roomCode];
    if (!room) return;
    let player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    io.to(roomCode).emit('receiveMessage', {
      username: player.username,
      message: message.trim(),
      alive: player.alive,
      role: room.gameState === 'ENDED' ? player.role : ''
    });
  });

  socket.on('startGame', ({ roomCode, opts }) => {
    let room = rooms[roomCode];
    if (!room || room.players[0].id !== socket.id) return; 
    if (room.players.length < 3) return socket.emit('errorMsg', 'Il faut au moins 3 joueurs pour lancer !');

    room.opts = opts;
    room.gameState = 'PLAYING';
    
    if (room.usedWordIndexes.length >= DB.length) {
      room.usedWordIndexes = []; 
    }

    let availableIndexes = [];
    for (let i = 0; i < DB.length; i++) {
      if (!room.usedWordIndexes.includes(i)) {
        availableIndexes.push(i);
      }
    }

    let randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
    room.usedWordIndexes.push(randomIndex);

    let pair = DB[randomIndex];
    let swap = Math.random() > 0.5;
    room.wordA = swap ? pair.b : pair.a;
    room.wordB = swap ? pair.a : pair.b;
    room.interditWord = pair.i;
    room.bavWord = pair.bav; // Utilise désormais l'indice contextuel du bloc ou BAV_POOL si vous préférez

    let config = ROLE_TABLE[room.players.length];
    let roles = [];
    for(let i=0; i<config.civil; i++) roles.push('civil');
    for(let i=0; i<config.under; i++) roles.push('under');
    for(let i=0; i<config.white; i++) roles.push('white');
    
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

  socket.on('startVotingPhase', (roomCode) => {
    let room = rooms[roomCode];
    if (!room) return;
    room.gameState = 'VOTING';
    room.votes = {};
    io.to(roomCode).emit('votingPhase', { players: room.players.filter(p => p.alive) });
  });

  socket.on('submitVote', ({ roomCode, targetId }) => {
    let room = rooms[roomCode];
    if (!room || room.gameState !== 'VOTING') return;
    
    room.votes[socket.id] = targetId;
    let alivePlayers = room.players.filter(p => p.alive);
    
    if (Object.keys(room.votes).length === alivePlayers.length) {
      resolveVotes(roomCode);
    }
  });

  socket.on('submitWhiteGuess', ({ roomCode, guess }) => {
    let room = rooms[roomCode];
    if (!room) return;
    let whitePlayer = room.players.find(p => p.id === room.pendingWhiteId);
    let target = room.wordA.toLowerCase();
    
    if (guess.trim().toLowerCase() === target || (target.includes(guess.trim().toLowerCase()) && guess.trim().length > 2)) {
      endGame(roomCode, 'white_win', `🕵️ Mr White (${whitePlayer.username}) a hacké le système ! Il a deviné le mot "${room.wordA}".`);
    } else {
      io.to(roomCode).emit('toastMsg', `❌ Mauvais mot ! Mr White reste éliminé.`);
      checkVictoryConditions(roomCode);
    }
  });

  socket.on('submitHunterShot', ({ roomCode, targetId }) => {
    let room = rooms[roomCode];
    if (!room) return;
    let target = room.players.find(p => p.id === targetId);
    
    if (target.role === 'under' || target.role === 'white') {
      target.alive = false;
      io.to(roomCode).emit('toastMsg', `🎯 HEADSHOT ! L'intrus ${target.username} est éliminé !`);
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
    endGame(roomCode, 'civils', "Tous les intrus ont été démasqués ! Victoire des Civils !");
  } else if (civils.length <= impostors.length) {
    endGame(roomCode, 'impostors', "Les intrus ont pris le contrôle du salon ! Victoire des Intrus.");
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
http.listen(PORT, () => console.log(`🎮 UNDERTAKER en ligne sur le port ${PORT}`));
