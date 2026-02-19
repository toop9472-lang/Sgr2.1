// Games Screen - Professional Gaming Hub
// Puzzle + Chess + Tic-Tac-Toe with Global Leaderboard
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import storage from '../services/storage';

const { width } = Dimensions.get('window');

// ==================== PUZZLE GAME ====================
const PuzzleGame = ({ onComplete, onClose }) => {
  const [pieces, setPieces] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [completed, setCompleted] = useState(false);
  const gridSize = 3; // 3x3 puzzle

  const images = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=300',
  ];

  useEffect(() => {
    initializePuzzle();
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning && !completed) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, completed]);

  const initializePuzzle = () => {
    const totalPieces = gridSize * gridSize;
    const shuffled = [...Array(totalPieces).keys()]
      .sort(() => Math.random() - 0.5);
    setPieces(shuffled);
    setMoves(0);
    setTimer(0);
    setIsRunning(true);
    setCompleted(false);
  };

  const handlePiecePress = (index) => {
    if (completed) return;
    
    if (selectedPiece === null) {
      setSelectedPiece(index);
    } else {
      // Swap pieces
      const newPieces = [...pieces];
      [newPieces[selectedPiece], newPieces[index]] = [newPieces[index], newPieces[selectedPiece]];
      setPieces(newPieces);
      setMoves(m => m + 1);
      setSelectedPiece(null);

      // Check if solved
      if (newPieces.every((piece, idx) => piece === idx)) {
        setCompleted(true);
        setIsRunning(false);
        const points = Math.max(100 - moves * 2 - Math.floor(timer / 10), 10);
        setTimeout(() => onComplete(points, moves, timer), 500);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>🧩 تركيب الصور</Text>
        <TouchableOpacity onPress={initializePuzzle} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={18} color="#60a5fa" />
          <Text style={styles.statValue}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="swap-horizontal" size={18} color="#f59e0b" />
          <Text style={styles.statValue}>{moves} حركة</Text>
        </View>
      </View>

      <View style={styles.puzzleGrid}>
        {pieces.map((piece, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.puzzlePiece,
              selectedPiece === index && styles.selectedPiece,
              completed && piece === index && styles.correctPiece,
            ]}
            onPress={() => handlePiecePress(index)}
          >
            <LinearGradient
              colors={completed ? ['#10b981', '#059669'] : ['#1e293b', '#334155']}
              style={styles.pieceGradient}
            >
              <Text style={styles.pieceNumber}>{piece + 1}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {completed && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>🎉 أحسنت!</Text>
        </View>
      )}
    </View>
  );
};

// ==================== TIC TAC TOE ====================
const TicTacToe = ({ onComplete, onClose }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  const checkWinner = (squares) => {
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.every(s => s !== null) ? 'draw' : null;
  };

  const minimax = (squares, isMaximizing) => {
    const result = checkWinner(squares);
    if (result === 'O') return 10;
    if (result === 'X') return -10;
    if (result === 'draw') return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          bestScore = Math.max(bestScore, minimax(squares, false));
          squares[i] = null;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          bestScore = Math.min(bestScore, minimax(squares, true));
          squares[i] = null;
        }
      }
      return bestScore;
    }
  };

  const aiMove = (currentBoard) => {
    let bestScore = -Infinity;
    let bestMove = null;
    
    // Add some randomness for easier gameplay
    if (Math.random() < 0.3) {
      const emptySquares = currentBoard.map((s, i) => s === null ? i : null).filter(i => i !== null);
      return emptySquares[Math.floor(Math.random() * emptySquares.length)];
    }

    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        currentBoard[i] = 'O';
        const score = minimax(currentBoard, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const handlePress = (index) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      handleGameEnd(result, newBoard);
      return;
    }

    setIsPlayerTurn(false);
    setTimeout(() => {
      const aiIndex = aiMove([...newBoard]);
      if (aiIndex !== null) {
        newBoard[aiIndex] = 'O';
        setBoard([...newBoard]);
        const aiResult = checkWinner(newBoard);
        if (aiResult) {
          handleGameEnd(aiResult, newBoard);
        } else {
          setIsPlayerTurn(true);
        }
      }
    }, 500);
  };

  const handleGameEnd = (result, finalBoard) => {
    setGameOver(true);
    setWinner(result);
    if (result === 'X') {
      setPlayerScore(s => s + 1);
      onComplete(50, 'win');
    } else if (result === 'draw') {
      onComplete(20, 'draw');
    } else {
      setAiScore(s => s + 1);
      onComplete(5, 'lose');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>⭕ إكس أو</Text>
        <TouchableOpacity onPress={resetGame} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color="#60a5fa" />
        </TouchableOpacity>
      </View>

      <View style={styles.scoreBoard}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>أنت (X)</Text>
          <Text style={styles.scoreValue}>{playerScore}</Text>
        </View>
        <Text style={styles.vsText}>VS</Text>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>الذكاء (O)</Text>
          <Text style={styles.scoreValue}>{aiScore}</Text>
        </View>
      </View>

      <View style={styles.tttBoard}>
        {board.map((cell, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tttCell,
              index % 3 !== 2 && styles.tttCellBorderRight,
              index < 6 && styles.tttCellBorderBottom,
            ]}
            onPress={() => handlePress(index)}
          >
            <Text style={[
              styles.tttCellText,
              cell === 'X' && styles.tttX,
              cell === 'O' && styles.tttO,
            ]}>
              {cell}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {gameOver && (
        <View style={styles.gameOverBanner}>
          <Text style={styles.gameOverText}>
            {winner === 'X' ? '🎉 فزت!' : winner === 'draw' ? '🤝 تعادل' : '😔 خسرت'}
          </Text>
          <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
            <Text style={styles.playAgainText}>العب مرة أخرى</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ==================== CHESS (Simplified) ====================
const ChessGame = ({ onComplete, onClose }) => {
  const [message, setMessage] = useState('');
  
  // Simple chess puzzle - find the best move
  const [puzzle, setPuzzle] = useState({
    question: 'أين تضع الملكة لتحقق الشاه؟',
    board: [
      ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
      ['♟', '♟', '♟', ' ', '♟', '♟', '♟', '♟'],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', '♟', ' ', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', '♙', ' ', ' ', ' '],
      [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
      ['♙', '♙', '♙', '♙', ' ', '♙', '♙', '♙'],
      ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
    ],
    correctAnswer: { row: 0, col: 7 },
    hint: 'فكر في الزاوية',
  });
  
  const [selectedCell, setSelectedCell] = useState(null);
  const [solved, setSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleCellPress = (row, col) => {
    if (solved) return;
    
    setSelectedCell({ row, col });
    setAttempts(a => a + 1);
    
    if (row === puzzle.correctAnswer.row && col === puzzle.correctAnswer.col) {
      setSolved(true);
      const points = Math.max(100 - attempts * 10, 20);
      setMessage('🎉 إجابة صحيحة!');
      setTimeout(() => onComplete(points, attempts), 1000);
    } else {
      setMessage('❌ حاول مرة أخرى');
    }
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.gameTitle}>♟️ ألغاز الشطرنج</Text>
        <View style={styles.resetBtn} />
      </View>

      <View style={styles.puzzleQuestion}>
        <Text style={styles.questionText}>{puzzle.question}</Text>
        <Text style={styles.hintText}>💡 {puzzle.hint}</Text>
      </View>

      <View style={styles.chessBoard}>
        {puzzle.board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.chessRow}>
            {row.map((piece, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.chessCell,
                  (rowIndex + colIndex) % 2 === 0 ? styles.lightCell : styles.darkCell,
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex && styles.selectedChessCell,
                  solved && rowIndex === puzzle.correctAnswer.row && colIndex === puzzle.correctAnswer.col && styles.correctCell,
                ]}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              >
                <Text style={styles.chessPiece}>{piece}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {message ? (
        <View style={[styles.messageBanner, solved && styles.successBanner]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <Text style={styles.attemptsText}>المحاولات: {attempts}</Text>
    </View>
  );
};

// ==================== MAIN GAMES SCREEN ====================
const GamesScreen = ({ user, onPointsEarned }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState({ rank: 0, totalPoints: 0, gamesPlayed: 0 });
  const [loading, setLoading] = useState(true);
  const pulseAnim = new Animated.Value(1);

  const games = [
    {
      id: 'puzzle',
      name: 'تركيب الصور',
      icon: '🧩',
      color: ['#8b5cf6', '#6d28d9'],
      description: 'رتب القطع واكسب نقاط',
      maxPoints: 100,
    },
    {
      id: 'tictactoe',
      name: 'إكس أو',
      icon: '⭕',
      color: ['#f59e0b', '#d97706'],
      description: 'تحدى الذكاء الاصطناعي',
      maxPoints: 50,
    },
    {
      id: 'chess',
      name: 'ألغاز الشطرنج',
      icon: '♟️',
      color: ['#10b981', '#059669'],
      description: 'حل الألغاز واكسب',
      maxPoints: 100,
    },
  ];

  useEffect(() => {
    fetchLeaderboard();
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchLeaderboard = async () => {
    try {
      const token = await storage.getToken();
      const response = await api.fetch('/api/games/leaderboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setUserStats(data.userStats || { rank: 0, totalPoints: 0, gamesPlayed: 0 });
      }
    } catch (error) {
      console.log('Leaderboard error:', error);
      // Set mock data for demo
      setLeaderboard([
        { rank: 1, name: 'محمد', points: 2500, avatar: '🥇' },
        { rank: 2, name: 'أحمد', points: 2100, avatar: '🥈' },
        { rank: 3, name: 'سارة', points: 1800, avatar: '🥉' },
        { rank: 4, name: 'فاطمة', points: 1500, avatar: '🎮' },
        { rank: 5, name: 'خالد', points: 1200, avatar: '🎮' },
      ]);
      setUserStats({ rank: 15, totalPoints: 450, gamesPlayed: 12 });
    } finally {
      setLoading(false);
    }
  };

  const handleGameComplete = async (gameId, points, ...args) => {
    try {
      const token = await storage.getToken();
      await api.fetch('/api/games/complete', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ gameId, points }),
      });
      
      if (onPointsEarned) {
        onPointsEarned(points);
      }
      
      Alert.alert(
        '🎉 أحسنت!',
        `لقد ربحت ${points} نقطة!`,
        [{ text: 'حسناً', onPress: () => setActiveGame(null) }]
      );
      
      fetchLeaderboard();
    } catch (error) {
      console.log('Game complete error:', error);
      Alert.alert('🎉 أحسنت!', `لقد ربحت ${points} نقطة!`);
      setActiveGame(null);
    }
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'puzzle':
        return (
          <PuzzleGame
            onComplete={(points, moves, time) => handleGameComplete('puzzle', points, moves, time)}
            onClose={() => setActiveGame(null)}
          />
        );
      case 'tictactoe':
        return (
          <TicTacToe
            onComplete={(points, result) => handleGameComplete('tictactoe', points, result)}
            onClose={() => setActiveGame(null)}
          />
        );
      case 'chess':
        return (
          <ChessGame
            onComplete={(points, attempts) => handleGameComplete('chess', points, attempts)}
            onClose={() => setActiveGame(null)}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎮 الألعاب</Text>
          <Text style={styles.headerSubtitle}>العب واكسب النقاط</Text>
        </View>

        {/* User Stats Card */}
        <View style={styles.userStatsCard}>
          <LinearGradient
            colors={['#1e293b', '#0f172a']}
            style={styles.statsGradient}
          >
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>#{userStats.rank || '-'}</Text>
              <Text style={styles.statsLabel}>ترتيبك</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{userStats.totalPoints || 0}</Text>
              <Text style={styles.statsLabel}>نقاطك</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{userStats.gamesPlayed || 0}</Text>
              <Text style={styles.statsLabel}>ألعابك</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Games Grid */}
        <Text style={styles.sectionTitle}>🕹️ اختر لعبة</Text>
        <View style={styles.gamesGrid}>
          {games.map((game) => (
            <Animated.View
              key={game.id}
              style={[styles.gameCardWrapper, { transform: [{ scale: pulseAnim }] }]}
            >
              <TouchableOpacity
                style={styles.gameCard}
                onPress={() => setActiveGame(game.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={game.color}
                  style={styles.gameCardGradient}
                >
                  <View style={styles.gameIconContainer}>
                    <Text style={styles.gameIcon}>{game.icon}</Text>
                  </View>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDesc}>{game.description}</Text>
                  <View style={styles.pointsBadge}>
                    <Ionicons name="star" size={12} color="#fbbf24" />
                    <Text style={styles.pointsText}>حتى {game.maxPoints} نقطة</Text>
                  </View>
                  
                  {/* Glow Effect */}
                  <View style={styles.glowEffect} />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>🏆 التصنيف العالمي</Text>
        <View style={styles.leaderboardContainer}>
          {leaderboard.slice(0, 10).map((player, index) => (
            <View
              key={index}
              style={[
                styles.leaderboardItem,
                index < 3 && styles.topThree,
              ]}
            >
              <View style={styles.rankBadge}>
                <Text style={[
                  styles.rankText,
                  index === 0 && styles.goldRank,
                  index === 1 && styles.silverRank,
                  index === 2 && styles.bronzeRank,
                ]}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${player.rank}`}
                </Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerGames}>{player.gamesPlayed || 0} لعبة</Text>
              </View>
              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text style={styles.playerPoints}>{player.points}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Game Modal */}
      <Modal
        visible={activeGame !== null}
        animationType="slide"
        transparent={false}
      >
        <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.modalContainer}>
          {renderGame()}
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
  userStatsCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  statsLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'right',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  gameCardWrapper: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gameCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 180,
    position: 'relative',
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 32,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 11,
    color: '#fbbf24',
    fontWeight: '600',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  leaderboardContainer: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderRadius: 16,
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  topThree: {
    backgroundColor: 'rgba(251,191,36,0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rankBadge: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  goldRank: {
    fontSize: 24,
  },
  silverRank: {
    fontSize: 24,
  },
  bronzeRank: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  playerGames: {
    fontSize: 12,
    color: '#888',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerPoints: {
    fontSize: 16,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  // Game Container Styles
  modalContainer: {
    flex: 1,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(96,165,250,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Puzzle Styles
  puzzleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  puzzlePiece: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedPiece: {
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  correctPiece: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  pieceGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieceNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  completedBanner: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 24,
    color: '#10b981',
    fontWeight: 'bold',
  },
  // Tic Tac Toe Styles
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#888',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vsText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  tttBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width - 80,
    alignSelf: 'center',
  },
  tttCell: {
    width: (width - 80) / 3,
    height: (width - 80) / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tttCellBorderRight: {
    borderRightWidth: 2,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  tttCellBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  tttCellText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tttX: {
    color: '#60a5fa',
  },
  tttO: {
    color: '#f59e0b',
  },
  gameOverBanner: {
    marginTop: 30,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  playAgainBtn: {
    backgroundColor: '#60a5fa',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  playAgainText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Chess Styles
  puzzleQuestion: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  chessBoard: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  chessRow: {
    flexDirection: 'row',
  },
  chessCell: {
    width: (width - 80) / 8,
    height: (width - 80) / 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightCell: {
    backgroundColor: '#f0d9b5',
  },
  darkCell: {
    backgroundColor: '#b58863',
  },
  selectedChessCell: {
    backgroundColor: '#7fadcf',
  },
  correctCell: {
    backgroundColor: '#7bc96f',
  },
  chessPiece: {
    fontSize: 24,
  },
  messageBanner: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 8,
    alignItems: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  messageText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  attemptsText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
});

export default GamesScreen;
