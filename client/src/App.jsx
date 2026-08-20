import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

function App() {
  const [page, setPage] = useState('home');
  const [roomId, setRoomId] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('room_joined', ({ roomId, playerId: pid, room }) => {
      setRoomId(roomId);
      setPlayerId(socket.id);
      setRoomData(room);
      setPage('lobby');
    });

    socket.on('room_update', ({ players }) => {
      setRoomData(prev => prev ? { ...prev, players } : prev);
    });

    socket.on('game_started', () => {
      setPage('game');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_joined');
      socket.off('room_update');
      socket.off('game_started');
    };
  }, []);

  const handleCreateRoom = useCallback((name) => {
    setPlayerName(name);
    socket.emit('create_room', { playerName: name });
  }, []);

  const handleJoinRoom = useCallback((code, name) => {
    setPlayerName(name);
    socket.emit('join_room', { roomId: code.toUpperCase(), playerName: name });
  }, []);

  const handleBackToHome = useCallback(() => {
    socket.disconnect();
    socket.connect();
    setPage('home');
    setRoomId('');
    setRoomData(null);
  }, []);

  const handleStartGame = useCallback(() => {
    socket.emit('start_game');
  }, []);

  if (page === 'home') {
    return <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} connected={connected} />;
  }

  if (page === 'lobby') {
    return <Lobby roomId={roomId} playerId={playerId} roomData={roomData} onStartGame={handleStartGame} onBack={handleBackToHome} />;
  }

  return <Game roomId={roomId} playerId={playerId} playerName={playerName} roomData={roomData} onBack={handleBackToHome} />;
}

export default App;