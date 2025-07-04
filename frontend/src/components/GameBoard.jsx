import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Users, Target, Crown } from 'lucide-react';

const GameBoard = () => {
  const [gameState, setGameState] = useState({
    phase: 1, // 1: placing, 2: moving, 3: flying
    currentPlayer: 1, // 1 or 2
    player1Cows: 12,
    player2Cows: 12,
    player1OnBoard: 0,
    player2OnBoard: 0,
    board: new Array(24).fill(null), // 24 positions on the board
    selectedPosition: null,
    mills: [],
    removingPiece: false,
    winner: null,
    gameHistory: []
  });

  // Define the board positions and their connections
  const boardPositions = [
    // Outer square: 0-7
    { x: 50, y: 50, connections: [1, 9] },     // 0
    { x: 200, y: 50, connections: [0, 2, 4] }, // 1
    { x: 350, y: 50, connections: [1, 14] },   // 2
    { x: 350, y: 200, connections: [2, 4, 7] }, // 3
    { x: 350, y: 350, connections: [3, 5] },   // 4
    { x: 200, y: 350, connections: [4, 6, 7] }, // 5
    { x: 50, y: 350, connections: [5, 11] },   // 6
    { x: 50, y: 200, connections: [6, 0, 3] }, // 7
    
    // Middle square: 8-15
    { x: 100, y: 100, connections: [9, 15] },   // 8
    { x: 200, y: 100, connections: [8, 10, 1] }, // 9
    { x: 300, y: 100, connections: [9, 14] },   // 10
    { x: 300, y: 200, connections: [10, 12, 3] }, // 11
    { x: 300, y: 300, connections: [11, 13] },  // 12
    { x: 200, y: 300, connections: [12, 14, 5] }, // 13
    { x: 100, y: 300, connections: [13, 15] },  // 14
    { x: 100, y: 200, connections: [14, 8, 7] }, // 15
    
    // Inner square: 16-23
    { x: 150, y: 150, connections: [17, 23] },  // 16
    { x: 200, y: 150, connections: [16, 18, 9] }, // 17
    { x: 250, y: 150, connections: [17, 19] },  // 18
    { x: 250, y: 200, connections: [18, 20, 11] }, // 19
    { x: 250, y: 250, connections: [19, 21] },  // 20
    { x: 200, y: 250, connections: [20, 22, 13] }, // 21
    { x: 150, y: 250, connections: [21, 23] },  // 22
    { x: 150, y: 200, connections: [22, 16, 15] }, // 23
  ];

  // Define mill combinations (3 in a row)
  const millCombinations = [
    // Outer square
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    // Middle square
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    // Inner square
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    // Vertical lines
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23]
  ];

  // Check if a mill is formed
  const checkMill = (board, position, player) => {
    return millCombinations.some(mill => 
      mill.includes(position) && 
      mill.every(pos => board[pos] === player)
    );
  };

  // Get all current mills for a player
  const getCurrentMills = (board, player) => {
    return millCombinations.filter(mill => 
      mill.every(pos => board[pos] === player)
    );
  };

  // Handle position click
  const handlePositionClick = (positionIndex) => {
    if (gameState.winner || gameState.removingPiece) {
      if (gameState.removingPiece) {
        handleRemovePiece(positionIndex);
      }
      return;
    }

    const newGameState = { ...gameState };
    const newBoard = [...gameState.board];

    if (gameState.phase === 1) {
      // Placing phase
      if (newBoard[positionIndex] === null) {
        newBoard[positionIndex] = gameState.currentPlayer;
        
        if (gameState.currentPlayer === 1) {
          newGameState.player1Cows--;
          newGameState.player1OnBoard++;
        } else {
          newGameState.player2Cows--;
          newGameState.player2OnBoard++;
        }

        // Check for mill
        if (checkMill(newBoard, positionIndex, gameState.currentPlayer)) {
          newGameState.removingPiece = true;
          newGameState.mills = getCurrentMills(newBoard, gameState.currentPlayer);
        } else {
          newGameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        }

        // Check if placing phase is over
        if (newGameState.player1Cows === 0 && newGameState.player2Cows === 0) {
          newGameState.phase = 2;
        }
      }
    } else if (gameState.phase === 2 || gameState.phase === 3) {
      // Moving/Flying phase
      if (gameState.selectedPosition === null) {
        // Select a piece to move
        if (newBoard[positionIndex] === gameState.currentPlayer) {
          newGameState.selectedPosition = positionIndex;
        }
      } else {
        // Move the selected piece
        if (positionIndex === gameState.selectedPosition) {
          // Deselect
          newGameState.selectedPosition = null;
        } else if (newBoard[positionIndex] === null) {
          // Check if move is valid
          const canMove = gameState.phase === 3 || // Flying phase
            boardPositions[gameState.selectedPosition].connections.includes(positionIndex);
          
          if (canMove) {
            newBoard[positionIndex] = gameState.currentPlayer;
            newBoard[gameState.selectedPosition] = null;
            newGameState.selectedPosition = null;

            // Check for mill
            if (checkMill(newBoard, positionIndex, gameState.currentPlayer)) {
              newGameState.removingPiece = true;
              newGameState.mills = getCurrentMills(newBoard, gameState.currentPlayer);
            } else {
              newGameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
            }
          }
        }
      }
    }

    newGameState.board = newBoard;
    setGameState(newGameState);
  };

  // Handle piece removal
  const handleRemovePiece = (positionIndex) => {
    const newGameState = { ...gameState };
    const newBoard = [...gameState.board];
    const opponent = gameState.currentPlayer === 1 ? 2 : 1;

    if (newBoard[positionIndex] === opponent) {
      // Check if the piece is not in a mill (unless all pieces are in mills)
      const opponentMills = getCurrentMills(newBoard, opponent);
      const isInMill = opponentMills.some(mill => mill.includes(positionIndex));
      const allInMills = newBoard
        .map((piece, index) => ({ piece, index }))
        .filter(({ piece }) => piece === opponent)
        .every(({ index }) => opponentMills.some(mill => mill.includes(index)));

      if (!isInMill || allInMills) {
        newBoard[positionIndex] = null;
        
        if (opponent === 1) {
          newGameState.player1OnBoard--;
        } else {
          newGameState.player2OnBoard--;
        }

        newGameState.removingPiece = false;
        newGameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        
        // Check for win condition
        const opponentPieces = opponent === 1 ? newGameState.player1OnBoard : newGameState.player2OnBoard;
        if (opponentPieces <= 2) {
          newGameState.winner = gameState.currentPlayer;
        } else if (opponentPieces === 3) {
          newGameState.phase = 3; // Flying phase for opponent
        }
      }
    }

    newGameState.board = newBoard;
    setGameState(newGameState);
  };

  // Reset game
  const resetGame = () => {
    setGameState({
      phase: 1,
      currentPlayer: 1,
      player1Cows: 12,
      player2Cows: 12,
      player1OnBoard: 0,
      player2OnBoard: 0,
      board: new Array(24).fill(null),
      selectedPosition: null,
      mills: [],
      removingPiece: false,
      winner: null,
      gameHistory: []
    });
  };

  const getPhaseText = () => {
    switch (gameState.phase) {
      case 1: return "Placing Cows";
      case 2: return "Moving Cows";
      case 3: return "Flying Cows";
      default: return "Unknown Phase";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900 mb-2">Morabaraba</h1>
          <p className="text-amber-700">Traditional South African Strategy Game</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-amber-200">
              <div className="relative">
                <svg 
                  width="400" 
                  height="400" 
                  viewBox="0 0 400 400" 
                  className="w-full h-auto border-2 border-amber-300 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50"
                >
                  {/* Draw board lines */}
                  <defs>
                    <pattern id="boardPattern" patternUnits="userSpaceOnUse" width="400" height="400">
                      <rect width="400" height="400" fill="url(#boardGradient)" />
                    </pattern>
                    <linearGradient id="boardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#fef3c7', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#fed7aa', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>

                  {/* Board structure */}
                  {/* Outer square */}
                  <rect x="50" y="50" width="300" height="300" fill="none" stroke="#92400e" strokeWidth="2" />
                  {/* Middle square */}
                  <rect x="100" y="100" width="200" height="200" fill="none" stroke="#92400e" strokeWidth="2" />
                  {/* Inner square */}
                  <rect x="150" y="150" width="100" height="100" fill="none" stroke="#92400e" strokeWidth="2" />
                  
                  {/* Connecting lines */}
                  <line x1="200" y1="50" x2="200" y2="150" stroke="#92400e" strokeWidth="2" />
                  <line x1="200" y1="250" x2="200" y2="350" stroke="#92400e" strokeWidth="2" />
                  <line x1="50" y1="200" x2="150" y2="200" stroke="#92400e" strokeWidth="2" />
                  <line x1="250" y1="200" x2="350" y2="200" stroke="#92400e" strokeWidth="2" />

                  {/* Board positions */}
                  {boardPositions.map((pos, index) => {
                    const piece = gameState.board[index];
                    const isSelected = gameState.selectedPosition === index;
                    const isHighlighted = gameState.removingPiece && piece && piece !== gameState.currentPlayer;
                    
                    return (
                      <g key={index}>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="15"
                          fill={
                            piece === 1 ? '#1f2937' : 
                            piece === 2 ? '#f9fafb' : 
                            '#e5e7eb'
                          }
                          stroke={
                            isSelected ? '#059669' : 
                            isHighlighted ? '#ea580c' : 
                            piece === 1 ? '#000000' :
                            piece === 2 ? '#374151' :
                            '#9ca3af'
                          }
                          strokeWidth={isSelected || isHighlighted ? 4 : piece ? 3 : 2}
                          className="cursor-pointer hover:opacity-80 transition-all duration-200"
                          onClick={() => handlePositionClick(index)}
                        />
                        {piece && (
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="10"
                            fill={
                              piece === 1 ? '#000000' : '#ffffff'
                            }
                            stroke={
                              piece === 1 ? '#374151' : '#9ca3af'
                            }
                            strokeWidth="1"
                            className="pointer-events-none"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
          </div>

          {/* Game Info */}
          <div className="space-y-4">
            {/* Current Player */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-900">Current Turn</h3>
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <Badge 
                variant={gameState.currentPlayer === 1 ? "destructive" : "default"}
                className="text-lg p-2"
              >
                Player {gameState.currentPlayer} {gameState.currentPlayer === 1 ? '🐄' : '🐂'}
              </Badge>
            </Card>

            {/* Game Phase */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-900">Game Phase</h3>
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-amber-800">{getPhaseText()}</p>
              <p className="text-sm text-amber-600 mt-1">
                {gameState.removingPiece ? 'Remove opponent piece!' : 
                 gameState.phase === 1 ? 'Place your cows on the board' :
                 gameState.selectedPosition !== null ? 'Move to an empty position' :
                 'Select a cow to move'}
              </p>
            </Card>

            {/* Player Stats */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-3">Player Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-red-600">Player 1 🐄:</span>
                  <span>{gameState.player1Cows} left, {gameState.player1OnBoard} on board</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Player 2 🐂:</span>
                  <span>{gameState.player2Cows} left, {gameState.player2OnBoard} on board</span>
                </div>
              </div>
            </Card>

            {/* Winner */}
            {gameState.winner && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-900">Winner!</h3>
                  <Crown className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-green-800 text-lg">
                  Player {gameState.winner} {gameState.winner === 1 ? '🐄' : '🐂'} Wins!
                </p>
              </Card>
            )}

            {/* Controls */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-amber-200">
              <Button 
                onClick={resetGame}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                New Game
              </Button>
            </Card>

            {/* Rules */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-900">Rules</h3>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-sm text-amber-700 space-y-1">
                <p>• Each player has 12 cows</p>
                <p>• Form mills (3 in a row) to remove opponent's pieces</p>
                <p>• Win by reducing opponent to 2 cows</p>
                <p>• Flying phase: Move anywhere when you have 3 cows</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;